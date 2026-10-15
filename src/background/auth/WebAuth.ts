import browser, { type WebRequest } from 'webextension-polyfill';
import qs from 'qs';
import { nanoid } from 'nanoid';
import { interpret } from 'xstate';
import * as v from 'valibot';

import { AUTH_CLIENT_ID } from '../config';
import { log } from '../../common/logger';
import { sleep } from '../../common/helpers';
import { authAccessTokenScheme } from '../schema/auth/authAccessToken';
import { AuthCacheKey } from '../authentication/authCacheTypes';
import { type FallbackApiInterface } from '../api/fallbackApi';
import { type FlagsStorageInterface } from '../flagsStorage';
import { type AuthCacheInterface } from '../authentication/authCache';
import { type NotifierInterface } from '../../common/notifier';
import { type TabsInterface } from '../../common/tabs';
import { type WindowsApiInterface } from '../../common/windowsApi';

import { type AuthInterface } from './auth';
import { webAuthMachine } from './webAuthMachine';
import { WebAuthAction, WebAuthState } from './webAuthEnums';

/**
 * Schema for web authentication flow data persisted in the session storage.
 */
const webAuthFlowStorageDataSchema = v.object({
    authState: v.string(),
    tabId: v.number(),
});

/**
 * Set of valid web authentication states.
 */
const webAuthStatesSet = new Set<unknown>(Object.values(WebAuthState));

/**
 * Checks whether the value is a valid web authentication state.
 *
 * @param value Value to check.
 * @returns True if the value is a valid web authentication state.
 */
const isWebAuthState = (value: unknown): value is WebAuthState => webAuthStatesSet.has(value);

/**
 * Options for showing error state during web authentication flow.
 */
interface ShowErrorStateOptions {
    /**
     * Whether the web authentication tab should be closed.
     */
    shouldCloseWebAuthTab: boolean;

    /**
     * Whether the error was caused by tab modification (closed or replaced).
     */
    isCausedByTabModification: boolean;

    /**
     * Identity of the flow that caused the error.
     */
    flowId?: string;

    /**
     * Optional error information.
     */
    error?: unknown;
}

/**
 * WebAuth interface.
 */
export interface WebAuthInterface {
    /**
     * Handle web authentication flow actions.
     *
     * @param appId Application ID.
     * @param action Action done by the user.
     */
    handleAction(appId: string, action: WebAuthAction): Promise<void>;

    /**
     * Resolves when the web authentication flow state has been restored
     * from the session storage after the service worker wake-up.
     *
     * @returns Promise that resolves when the flow state is restored.
     */
    waitForInit(): Promise<void>;
}

/**
 * Constructor parameters for {@link WebAuth}.
 */
export interface WebAuthParameters {
    /**
     * Auth service.
     */
    auth: AuthInterface;

    /**
     * Auth cache.
     */
    authCache: AuthCacheInterface;

    /**
     * Flag storage.
     */
    flagsStorage: FlagsStorageInterface;

    /**
     * Fallback API.
     */
    fallbackApi: FallbackApiInterface;

    /**
     * Notifier service.
     */
    notifier: NotifierInterface;

    /**
     * Tabs interface.
     */
    tabs: TabsInterface;

    /**
     * Windows API.
     */
    windowsApi: WindowsApiInterface;
}

/**
 * Web authentication service.
 *
 * Detailed step-by-step flow:
 * 1. User clicks to "Log in or create an account" button from popup / consent page.
 * 2. Service receives message and calls {@link startWebAuthFlow}.
 * 3. We check current state of service:
 *   3.1. If {@link authState} is defined - there is ongoing flow, do nothing.
 *   3.2. If user is already authenticated - user needs to logout first, do nothing.
 * 4. Start flow by changing state to `WebAuthState.Loading`.
 * 5. Create new {@link authState} randomized value.
 * 6. Construct the authorization URL with all the necessary parameters,
 *    final URL will look like: `https://<auth-api-domain>/oauth/authorize?client_id=<clientId>&response_type=<responseType>&scope=<scope>&state=<state>&marketing_consent=<marketingConsent>&app_id=<appId>&redirect_uri=<redirectUri>`
 *    where each query param represents following values:
 *    - `<auth-api-domain>` - domain of the Auth API received from {@link fallbackApi}.
 *    - `<clientId>` - ID of the client application, see {@link AUTH_CLIENT_ID}.
 *    - `<responseType>` - type of the response, see {@link AUTH_RESPONSE_TYPE}.
 *    - `<scope>` - scope of the authentication, see {@link AUTH_SCOPE}.
 *    - `<state>` - unique state param generated at Step 5 (value of {@link authState}).
 *    - `<marketingConsent>` - always `false`, because we show Newsletter Screen after user authenticates.
 *    - `<appId>` - ID of the application (value of `appId` parameter).
 *    - `<redirectUri>` - URI to redirect after authentication, see {@link OAUTH_REDIRECT_URL}.
 * 7. Open new tab with constructed URL and save `tabId` to {@link webAuthTabId}.
 * 8. If something unexpected happens during Steps 2-7, we handle the error gracefully:
 *    - {@link authState} is set to `null`.
 *    - We close the web authentication tab if it was opened, also {@link webAuthTabId} is set to `null`.
 *    - State of flow changed to `WebAuthState.Failed`.
 * 9. User interacts with opened tab and authenticates.
 * 10. After successful authentication web redirects to `<redirectUri>`.
 * 11. We handle the redirect before request even happen in {@link handleOnBeforeRequest} method.
 *     The redirect must pass the following gates in {@link handleOnBeforeRequestAsync}:
 *     - The flow is active (auth state is set).
 *     - The request comes from the web authentication tab (tab ID matches).
 *     - The `state` param from the redirect URL hash matches the auth state.
 * 12. Final `responseUrl` is received by {@link finishWebAuthFlow} method.
 * 13. Web authentication tab is closed, also {@link webAuthTabId} is set to `null`.
 * 14. We check current state of service:
 *   14.1. If the flow is no longer active (cancelled or replaced by a new flow),
 *        the stale redirect is ignored as a no-op rather than treated as an error.
 *   14.2. If user is already authenticated - user needs to logout first, do nothing.
 * 15. Extract `hash` part from `responseUrl` and parse it as query params (thats how it passed from backend):
 *   15.1. Validate parsed query params, if everything is valid - continue further, otherwise throw an error.
 *   15.2. Match `state` param from query with auth state, if not equal - throw an error.
 * 16. Reset auth state to `null` - because no longer needed.
 * 17. Authenticate user with given access token via {@link auth.setAccessToken}.
 * 18. Modify flags storage:
 *   - If user logged in - call `flagsStorage.onAuthenticate()` to change appropriate flags,
 *   - If user registered - call `flagsStorage.onRegister()` to change appropriate flags.
 * 19. Clear {@link authCache} to reset flow state.
 * 20. Notify listeners that web auth flow finished and authenticated.
 *
 * The flow state is also persisted to the session storage when the flow starts and removed
 * when it finishes, so it can be restored after the service worker is woken up
 * (see {@link restoreWebAuthFlow}).
 *
 * We also track active authentication flow state (steps between 9-10):
 * - If user closes or moves away from web authentication tab to non-auth URLs:
 *    - {@link authState} is set to `null`.
 *    - {@link webAuthTabId} is set to `null`.
 *    - State of flow changed to `WebAuthState.FailedByUser`.
 * - If tab couldn't load URL due to network issues or other problems:
 *    - {@link authState} is set to `null`.
 *    - {@link webAuthTabId} is set to `null`.
 *    - State of flow changed to `WebAuthState.Failed`.
 * - Also user has ability to:
 *   - Cancel currently active authentication flow, in which we reset all state and close tab if it was open.
 *   - Reopen web authentication tab, in which we focus on window in which authentication tab is located,
 *     and also focus on tab itself.
 */
export class WebAuth implements WebAuthInterface {
    /**
     * Authentication scope.
     */
    private static readonly AUTH_SCOPE = 'trust';

    /**
     * Authentication response type.
     */
    private static readonly AUTH_RESPONSE_TYPE = 'token';

    /**
     * Path to the OAuth authorization endpoint.
     */
    private static readonly OAUTH_PATH = '/oauth/authorize';

    /**
     * Redirect URL for OAuth flow.
     *
     * IMPORTANT: This URL is fictional and will not be loaded, we use it as final redirect URL,
     * which we catch in `browser.webRequest.onBeforeRequest` event via {@link handleOnBeforeRequest}.
     */
    private static readonly OAUTH_REDIRECT_URL = 'https://extension-login.adguard.io/';

    /**
     * Value of `is_new_user` query param which means that user registered.
     *
     * Note: We don't use boolean here, because query params are always strings.
     */
    private static readonly OAUTH_IS_NEW_USER_VALUE = 'true';

    /**
     * Error string which means that request was aborted.
     */
    private static readonly NET_ABORTED_ERROR = 'net::ERR_ABORTED';

    /**
     * Session storage key for the web authentication flow data.
     *
     * Note: This intentionally lives outside of the {@link StateStorage} {@link StorageKey}
     * mechanism, because {@link StateStorage} throttles writes by 500ms,
     * while the flow state must survive an imminent service worker kill,
     * so it is written directly without any delay.
     */
    private static readonly WEB_AUTH_FLOW_STORAGE_KEY = 'webAuthFlowState';

    /**
     * Delay between attempts to close the web authentication tab.
     */
    private static readonly TAB_CLOSE_RETRY_DELAY_MS = 500;

    /**
     * How long to keep trying to close the web authentication tab while the user
     * is dragging it before giving up.
     */
    private static readonly TAB_CLOSE_RETRY_TIMEOUT_MS = 30 * 1000;

    /**
     * Auth service.
     */
    private auth: AuthInterface;

    /**
     * Auth cache.
     */
    private authCache: AuthCacheInterface;

    /**
     * Flag storage.
     */
    private flagsStorage: FlagsStorageInterface;

    /**
     * Fallback API.
     */
    private fallbackApi: FallbackApiInterface;

    /**
     * Notifier service.
     */
    private notifier: NotifierInterface;

    /**
     * Tabs interface.
     */
    private tabs: TabsInterface;

    /**
     * Windows API.
     */
    private windowsApi: WindowsApiInterface;

    /**
     * Web authentication state machine interpreter.
     */
    private interpreter = interpret(webAuthMachine);

    /**
     * Authentication state passed to backend.
     * After receiving the response from the backend,
     * this state will be used to verify the user's session.
     */
    private authState: string | null = null;

    /**
     * Identity of the current web authentication flow attempt.
     *
     * Unlike {@link authState}, it is assigned synchronously when a flow starts,
     * before any awaits, so a stale error handler from a previous flow can tell
     * whether a new flow was started even before the new flow's {@link authState}
     * is assigned. This lets {@link showErrorState} avoid failing a freshly started
     * flow while the previous flow is still closing its tab.
     */
    private flowId: string | null = null;

    /**
     * ID of the web authentication tab.
     */
    private webAuthTabId: number | null = null;

    /**
     * Auth API URL resolved once at the flow start, so the error handler
     * doesn't have to do network work on the error path.
     */
    private authApiUrl: string | null = null;

    /**
     * Auth API URL resolution started while restoring a flow.
     */
    private authApiUrlPromise: Promise<void> | null = null;

    /**
     * Auth state of the flow that is currently being finished.
     *
     * Guards against duplicate processing of the same flow's redirect (e.g. the user
     * reloads the redirect URL while the tab is being closed), while still allowing
     * a redirect from a freshly started flow to be handled independently.
     */
    private finishingAuthState: string | null = null;

    /**
     * Promise which resolves when the web authentication flow state is restored from the session storage.
     */
    private initPromise: Promise<void>;

    /**
     * Constructor.
     */
    constructor({
        auth,
        authCache,
        flagsStorage,
        fallbackApi,
        notifier,
        tabs,
        windowsApi,
    }: WebAuthParameters) {
        this.auth = auth;
        this.authCache = authCache;
        this.flagsStorage = flagsStorage;
        this.fallbackApi = fallbackApi;
        this.notifier = notifier;
        this.tabs = tabs;
        this.windowsApi = windowsApi;

        this.handleOnBeforeRequest = this.handleOnBeforeRequest.bind(this);
        this.handleOnErrorOccurred = this.handleOnErrorOccurred.bind(this);
        this.handleTabRemoved = this.handleTabRemoved.bind(this);
        this.handleTabReplaced = this.handleTabReplaced.bind(this);

        this.interpreter.onTransition((state) => {
            log.debug(`[vpn.WebAuth.constructor]: WebAuth state transitioned to "${state.value}"`);
            if (isWebAuthState(state.value)) {
                this.authCache.updateCache(AuthCacheKey.WebAuthFlowState, state.value);
            } else {
                log.error(`[vpn.WebAuth.constructor]: Unexpected WebAuth state: "${String(state.value)}".`);
            }
        });
        this.interpreter.start();

        // Register listeners on the service worker start so they are restored after its wake up
        this.registerEventListeners();

        // Restore web authentication flow state after the service worker wake up
        this.initPromise = this.restoreWebAuthFlow();
    }

    /**
     * Closes the web authentication tab if it's open.
     */
    private async closeWebAuthTab(): Promise<void> {
        // Do nothing if tab is not open
        const tabId = this.webAuthTabId;
        if (typeof tabId !== 'number') {
            return;
        }

        // Clear web authentication tab id
        this.webAuthTabId = null;

        // Close the tab, retrying while the user is dragging it. Chrome forbids editing
        // a tab during a drag, so close attempts fail until the drag is over.
        await this.closeWebAuthTabWithRetry(tabId);
    }

    /**
     * Closes the web authentication tab, retrying while the user is dragging it.
     *
     * Chrome forbids editing tabs while the user is dragging one, so closing the tab
     * may fail until the drag is over. The tab is polled until it can be closed or
     * the retry timeout expires.
     *
     * @param tabId The ID of the tab to close.
     */
    private async closeWebAuthTabWithRetry(tabId: number): Promise<void> {
        const maxAttempts = Math.ceil(WebAuth.TAB_CLOSE_RETRY_TIMEOUT_MS / WebAuth.TAB_CLOSE_RETRY_DELAY_MS);

        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
            // If the tab is already gone, consider it closed
            try {
                // eslint-disable-next-line no-await-in-loop
                await browser.tabs.get(tabId);
            } catch {
                log.debug(`[vpn.WebAuth.closeWebAuthTabWithRetry]: Web authentication tab with tabId#${tabId} is already closed.`);
                return;
            }

            try {
                // eslint-disable-next-line no-await-in-loop
                await this.tabs.closeTab(tabId);
                log.debug(`[vpn.WebAuth.closeWebAuthTabWithRetry]: Web authentication tab with tabId#${tabId} closed.`);
                return;
            } catch {
                // It might throw an error if the tab is already closed or the user is dragging it
            }

            // eslint-disable-next-line no-await-in-loop
            await sleep(WebAuth.TAB_CLOSE_RETRY_DELAY_MS);
        }

        log.error(`[vpn.WebAuth.closeWebAuthTabWithRetry]: Failed to close web authentication tab with tabId#${tabId} within ${WebAuth.TAB_CLOSE_RETRY_TIMEOUT_MS}ms.`);
    }

    /**
     * Registers event listeners needed for the web authentication flow.
     *
     * Note: Listeners are registered on the service worker start and are never removed,
     * because they are lost when the service worker dies and are not restored by the browser.
     * Handlers filter events by the restored flow state.
     */
    private registerEventListeners(): void {
        browser.webRequest.onBeforeRequest.addListener(this.handleOnBeforeRequest, {
            urls: [`${WebAuth.OAUTH_REDIRECT_URL}*`],
            types: ['main_frame'],
        });

        /**
         * We can't filter by the auth API URL at registration time, because it is resolved
         * asynchronously and may change at runtime, and we can't filter by the tab ID,
         * because it is known only after the flow starts. That's why we filter by all URLs
         * and check the tab ID and the URL hostname in {@link handleOnErrorOccurred}.
         */
        browser.webRequest.onErrorOccurred.addListener(this.handleOnErrorOccurred, {
            urls: ['<all_urls>'],
            types: ['main_frame'],
        });

        browser.tabs.onRemoved.addListener(this.handleTabRemoved);
        browser.tabs.onReplaced.addListener(this.handleTabReplaced);
    }

    /**
     * Saves web authentication flow state to the session storage.
     */
    private async saveWebAuthFlowToStorage(): Promise<void> {
        try {
            // Do nothing if flow state is not defined
            if (!this.authState || typeof this.webAuthTabId !== 'number') {
                log.debug('[vpn.WebAuth.saveWebAuthFlowToStorage]: Web authentication flow state is not fully defined, skipping save.');
                return;
            }

            const tabId = this.webAuthTabId;
            await browser.storage.session.set({
                [WebAuth.WEB_AUTH_FLOW_STORAGE_KEY]: {
                    authState: this.authState,
                    tabId,
                },
            });
        } catch (error) {
            log.error('[vpn.WebAuth.saveWebAuthFlowToStorage]: Failed to save flow state to session storage:', error);
        }
    }

    /**
     * Removes web authentication flow state from the session storage.
     */
    private async clearWebAuthFlowFromStorage(): Promise<void> {
        try {
            await browser.storage.session.remove(WebAuth.WEB_AUTH_FLOW_STORAGE_KEY);
        } catch (error) {
            log.error('[vpn.WebAuth.clearWebAuthFlowFromStorage]: Failed to remove flow state from session storage:', error);
        }
    }

    /**
     * Restores web authentication flow state from the session storage.
     *
     * This is needed because the service worker can die at any moment
     * while the flow is in progress, and the in-memory state would be lost otherwise.
     */
    private async restoreWebAuthFlow(): Promise<void> {
        try {
            const storageData = await browser.storage.session.get(WebAuth.WEB_AUTH_FLOW_STORAGE_KEY);
            const rawFlowData = storageData[WebAuth.WEB_AUTH_FLOW_STORAGE_KEY];

            // Do nothing if there is no stored web authentication flow
            if (rawFlowData === undefined) {
                return;
            }

            const webAuthFlowStorageData = v.safeParse(webAuthFlowStorageDataSchema, rawFlowData);

            // The stored entry is unreadable, clear it so it doesn't stay forever
            if (!webAuthFlowStorageData.success) {
                log.error('[vpn.WebAuth.restoreWebAuthFlow]: Failed to parse stored web authentication flow state, clearing it:', v.flatten(webAuthFlowStorageData.issues));
                await this.clearWebAuthFlowFromStorage();
                return;
            }

            const { authState, tabId } = webAuthFlowStorageData.output;

            // Check that the web authentication tab is still alive. We intentionally don't check
            // the tab URL: a valid login can be on an intermediate page (Google/Apple/Facebook)
            // or on the final redirect, none of which contain the OAuth path.
            try {
                await browser.tabs.get(tabId);
            } catch {
                // The tab was closed while the service worker was dead, so the stored flow is stale
                log.debug(`[vpn.WebAuth.restoreWebAuthFlow]: Web authentication tab with tabId#${tabId} no longer exists, clearing flow.`);
                await this.clearWebAuthFlowFromStorage();
                return;
            }

            log.debug(`[vpn.WebAuth.restoreWebAuthFlow]: Restoring web authentication flow with tabId#${tabId}.`);

            // Restore in-memory flow state
            this.authState = authState;
            this.flowId = authState;
            this.webAuthTabId = tabId;

            // Resolve the auth API URL outside initPromise so only the error handler waits for network work
            this.authApiUrlPromise = this.fallbackApi.getAuthApiUrl()
                .then((authApiUrl) => {
                    this.authApiUrl = `https://${authApiUrl}`;
                })
                .catch((error) => {
                    log.error('[vpn.WebAuth.restoreWebAuthFlow]: Failed to resolve auth API URL:', error);
                });

            // Restore web authentication flow state machine
            this.interpreter.send(WebAuthAction.Start);
        } catch (error) {
            log.error('[vpn.WebAuth.restoreWebAuthFlow]: Failed to restore web authentication flow state:', error);
        }
    }

    /**
     * Handles error state during web authentication flow.
     *
     * @param shouldCloseWebAuthTab Whether the web authentication tab should be closed.
     * @param isCausedByTabModification Whether the error was caused by tab modification (closed or replaced).
     * @param flowId Identity of the flow that caused the error.
     * @param error Handled error.
     */
    private async showErrorState({
        shouldCloseWebAuthTab,
        isCausedByTabModification,
        flowId: failedFlowId,
        error,
    }: ShowErrorStateOptions): Promise<void> {
        if (error) {
            log.error('[vpn.WebAuth.showErrorState]: Error occurred while ongoing web authentication flow: ', error);
        }

        if (failedFlowId && this.flowId !== failedFlowId) {
            log.debug('[vpn.WebAuth.showErrorState]: Error belongs to an inactive web authentication flow, skipping failure.');
            return;
        }

        const { flowId } = this;

        // Reset authentication state
        this.authState = null;

        // Remove flow state from the session storage first, so a new flow started
        // during the close retries doesn't get its persisted state wiped
        await this.clearWebAuthFlowFromStorage();

        // Close tab
        if (shouldCloseWebAuthTab) {
            await this.closeWebAuthTab();
        }

        // Only fail the flow if no new flow was started while the tab was being closed
        if (this.authState !== null || this.flowId !== flowId) {
            log.debug('[vpn.WebAuth.showErrorState]: A new web authentication flow was started, skipping failure.');
            return;
        }

        // Fail web authentication flow
        const action = isCausedByTabModification
            ? WebAuthAction.TabModified
            : WebAuthAction.Fail;
        this.interpreter.send(action);
    }

    /**
     * Handles the removal of a tab by resetting web authentication tab info if necessary.
     *
     * @param tabId The ID of the removed tab.
     */
    private async handleTabRemoved(tabId: number): Promise<void> {
        await this.initPromise;

        // Do nothing if closed tab is not web auth tab
        if (this.webAuthTabId !== tabId) {
            return;
        }

        log.debug(`[vpn.WebAuth.handleTabRemoved]: User closed web authentication tab with tabId#${tabId}`);

        // The tab is gone, so there is nothing to close later
        this.webAuthTabId = null;

        // Show error state
        await this.showErrorState({
            shouldCloseWebAuthTab: false,
            isCausedByTabModification: true,
        });
    }

    /**
     * Handles the replacement of a tab by removing the old tab info.
     *
     * @param addedTabId The ID of the newly created tab.
     * @param removedTabId The ID of the removed tab.
     */
    private async handleTabReplaced(addedTabId: number, removedTabId: number): Promise<void> {
        await this.handleTabRemoved(removedTabId);
    }

    /**
     * Handles errors occurred during web requests in the web authentication tab.
     *
     * @param details The details of the web request that caused the error.
     */
    private async handleOnErrorOccurred(details: WebRequest.OnErrorOccurredDetailsType): Promise<void> {
        try {
            await this.initPromise;

            // Do nothing if error is not related to the web authentication tab
            if (details.tabId !== this.webAuthTabId) {
                return;
            }

            const { flowId } = this;

            // Do nothing if there is no active flow to fail
            if (!flowId) {
                return;
            }

            /**
             * We should ignore errors if:
             * - It's our `redirect_uri` URL - because it's fictional and doesn't exist,
             *   it may throw `net::ERR_NAME_NOT_RESOLVED` error,
             *   this handled by {@link handleOnBeforeRequest} method.
             * - Error is `net::ERR_ABORTED` - because this error may happen when user
             *   navigate to another URL in the same tab while there are ongoing requests,
             *   in this case we shouldn't show error state, because user may navigate
             *   to another social login page or just reload the page.
             */
            if (
                details.url.startsWith(WebAuth.OAUTH_REDIRECT_URL)
                || details.error === WebAuth.NET_ABORTED_ERROR
            ) {
                return;
            }

            await this.authApiUrlPromise;

            // Do nothing if the auth API host is not resolved or the error URL is unrelated
            if (!this.authApiUrl || new URL(details.url).hostname !== new URL(this.authApiUrl).hostname) {
                return;
            }

            // Show error state
            const error = new Error(`Web authentication tab encountered a web request error: ${details.error}`);
            await this.showErrorState({
                shouldCloseWebAuthTab: true,
                isCausedByTabModification: false,
                flowId,
                error,
            });
        } catch (error) {
            log.error('[vpn.WebAuth.handleOnErrorOccurred]: Error occurred while handling web request error:', error);
        }
    }

    /**
     * Starts the web authentication flow.
     *
     * @param appId Application ID.
     */
    private async startWebAuthFlow(appId: string): Promise<void> {
        const flowId = nanoid();

        try {
            log.debug('[vpn.WebAuth.startWebAuthFlow]: Starting web authentication flow.');

            // If authentication state is defined - there is an ongoing flow
            if (this.authState) {
                log.debug('[vpn.WebAuth.startWebAuthFlow]: Web authentication flow is already in progress, skipping new request.');
                return;
            }

            this.flowId = flowId;

            // Do nothing if already authenticated - user must logout first
            if (await this.auth.isAuthenticated(false)) {
                log.debug('[vpn.WebAuth.startWebAuthFlow]: User is already authenticated, skipping web authentication request.');

                // Do not keep the flow id for a flow that never started
                if (this.flowId === flowId) {
                    this.flowId = null;
                }

                return;
            }

            // The flow could be cancelled or replaced while checking the auth status
            if (this.flowId !== flowId) {
                log.debug('[vpn.WebAuth.startWebAuthFlow]: Web authentication flow is no longer active after checking auth status, aborting start.');
                return;
            }

            // Generate new authentication state
            this.authState = nanoid();

            // Construct web authentication URL
            const authApiUrl = `https://${await this.fallbackApi.getAuthApiUrl()}`;

            // The flow could be cancelled or replaced while the auth API URL is being resolved
            if (this.flowId !== flowId) {
                log.debug('[vpn.WebAuth.startWebAuthFlow]: Web authentication flow is no longer active after resolving the auth API URL, aborting start.');
                return;
            }

            this.authApiUrl = authApiUrl;
            const params = qs.stringify({
                client_id: AUTH_CLIENT_ID,
                response_type: WebAuth.AUTH_RESPONSE_TYPE,
                scope: WebAuth.AUTH_SCOPE,
                state: this.authState,
                // Marketing consent always false because we show Newsletter Screen
                // after auth, where user can accept or deny marketing consent
                marketing_consent: false,
                app_id: appId,
                redirect_uri: WebAuth.OAUTH_REDIRECT_URL,
            });
            const webAuthUrl = `${authApiUrl}${WebAuth.OAUTH_PATH}?${params}`;

            // Open web authentication URL in new tab
            log.debug(`[vpn.WebAuth.startWebAuthFlow]: Opening web authentication with "${webAuthUrl}" URL in new tab.`);
            const tab = await this.tabs.openTab(webAuthUrl);
            log.debug(`[vpn.WebAuth.startWebAuthFlow]: Web authentication tab with tabId#${tab.id} and windowId#${tab.windowId} opened.`);

            // The tab id is required to manage the tab later
            if (typeof tab.id !== 'number') {
                throw new Error('Web authentication tab was opened without an id.');
            }

            // The flow could be cancelled or replaced while the tab is being opened,
            // so close the tab opened by this attempt to not leave it stranded
            if (this.flowId !== flowId) {
                log.debug(`[vpn.WebAuth.startWebAuthFlow]: Web authentication flow is no longer active after opening the tab, closing the tab with tabId#${tab.id}.`);
                await this.closeWebAuthTabWithRetry(tab.id);
                return;
            }

            // Save tab ID to be able to manage it later
            this.webAuthTabId = tab.id;

            // Save flow state so it can be restored after the service worker wake up
            await this.saveWebAuthFlowToStorage();
        } catch (error) {
            await this.showErrorState({
                shouldCloseWebAuthTab: true,
                isCausedByTabModification: false,
                flowId,
                error,
            });
        }
    }

    /**
     * Reopens the web authentication flow.
     */
    private async reopenWebAuthFlow(): Promise<void> {
        try {
            log.debug('[vpn.WebAuth.reopenWebAuthFlow]: Reopening web authentication tab');

            // If tab is unavailable - nothing to reopen
            const tabId = this.webAuthTabId;
            if (typeof tabId !== 'number') {
                log.debug('[vpn.WebAuth.reopenWebAuthFlow]: Web authentication tab is not available for reopening.');
                return;
            }

            // Read the current window ID from the tab, because the tab can be moved or torn off
            const tab = await browser.tabs.get(tabId);

            // Focus on window
            if (typeof tab.windowId === 'number') {
                log.debug(`[vpn.WebAuth.reopenWebAuthFlow]: Focusing on web authentication window with windowId#${tab.windowId}.`);
                await this.windowsApi.update(tab.windowId, { focused: true });
            }

            // Focus on tab
            log.debug(`[vpn.WebAuth.reopenWebAuthFlow]: Focusing on web authentication tab with tabId#${tabId}.`);
            await this.tabs.focusTab(tabId);
        } catch (error) {
            log.error('[vpn.WebAuth.reopenWebAuthFlow]: Error occurred while reopening web authentication flow: ', error);
        }
    }

    /**
     * Cancels the web authentication flow.
     */
    private async cancelWebAuthFlow(): Promise<void> {
        try {
            log.debug('[vpn.WebAuth.cancelWebAuthFlow]: Cancelling web authentication flow.');

            // Reset authentication state
            this.authState = null;
            this.flowId = null;

            // Remove flow state from the session storage first, so a new flow started
            // during the close retries doesn't get its persisted state wiped
            await this.clearWebAuthFlowFromStorage();

            // Close tab if it was opened
            await this.closeWebAuthTab();
        } catch (error) {
            log.error('[vpn.WebAuth.cancelWebAuthFlow]: Error occurred while cancelling web authentication flow: ', error);
        }
    }

    /**
     * Handles the onBeforeRequest event.
     *
     * @param details The details of the web request.
     */
    private handleOnBeforeRequest(details: WebRequest.OnBeforeRequestDetailsType): void {
        /**
         * Note 1: do not log `details` or `details.url`, because it contains sensitive information (token).
         * Note 2: we intentionally don't await the async handler, because the listener must return synchronously.
         */
        this.handleOnBeforeRequestAsync(details);
    }

    /**
     * Handles the web authentication redirect asynchronously.
     *
     * Note: We don't match the request by window ID, because the web authentication tab
     * can be moved or torn off into another window while the flow is in progress.
     * Instead we match the `state` param from the redirect URL hash with the stored
     * authentication state, and additionally check the tab ID in the handler,
     * which is stable when the tab is moved or torn off (unlike the window ID).
     *
     * @param details The details of the web request.
     */
    private async handleOnBeforeRequestAsync(details: WebRequest.OnBeforeRequestDetailsType): Promise<void> {
        try {
            await this.initPromise;

            if (!this.authState) {
                log.debug('[vpn.WebAuth.handleOnBeforeRequestAsync]: Web authentication flow is not active, ignoring redirect.');
                return;
            }

            if (details.tabId !== this.webAuthTabId) {
                log.debug(`[vpn.WebAuth.handleOnBeforeRequestAsync]: Redirect from tabId#${details.tabId} is not the web authentication tab, ignoring.`);
                return;
            }

            const { hash } = new URL(details.url);
            const { state } = qs.parse(hash.slice(1));

            if (state !== this.authState) {
                log.debug('[vpn.WebAuth.handleOnBeforeRequestAsync]: Redirect state does not match the authentication state, ignoring.');
                return;
            }

            await this.finishWebAuthFlow(details.url);
        } catch (error) {
            log.error('[vpn.WebAuth.handleOnBeforeRequestAsync]: Error occurred while handling web auth redirect:', error);
        }
    }

    /**
     * Callback for the web authentication flow.
     *
     * @param responseUrl The response URL from the authentication flow.
     */
    private async finishWebAuthFlow(responseUrl: string): Promise<void> {
        const { authState, flowId } = this;

        /**
         * Do nothing if there is no active flow, or if the same flow's redirect
         * is already being processed (e.g. the user reloads the redirect URL while
         * the tab is being closed). A redirect from a freshly started flow is still
         * handled, even while the previous flow is closing its tab.
         */
        if (!authState || !flowId || this.finishingAuthState === authState) {
            return;
        }

        this.finishingAuthState = authState;

        try {
            // Remove flow state from the session storage first, so a new flow started
            // while the tab is being closed doesn't get its persisted state wiped
            await this.clearWebAuthFlowFromStorage();

            // Close tab
            await this.closeWebAuthTab();

            // Note: do not log `responseUrl`, because it contains sensitive information (token)
            log.debug('[vpn.WebAuth.finishWebAuthFlow]: Response URL received for web authentication flow, authenticating user.');

            /**
             * If the flow is no longer active (cancelled or replaced by a new flow),
             * the stale redirect must be a no-op rather than an error.
             */
            if (this.authState !== authState) {
                log.debug('[vpn.WebAuth.finishWebAuthFlow]: Web authentication flow is not active, ignoring response.');
                return;
            }

            // Do nothing if already authenticated - user must logout first
            if (await this.auth.isAuthenticated(false)) {
                log.debug('[vpn.WebAuth.finishWebAuthFlow]: User is already authenticated, skipping web authentication request.');
                return;
            }

            // Re-check after the await, because the flow could be cancelled while checking auth status
            if (this.authState !== authState) {
                log.debug('[vpn.WebAuth.finishWebAuthFlow]: Web authentication flow is not active, ignoring response.');
                return;
            }

            // Get hash from URL, because that's how it passed from backend
            const { hash } = new URL(responseUrl);

            // Parse query string
            const {
                access_token: accessToken,
                expires_in: expiresIn,
                token_type: tokenType,
                state,
                is_new_user: strIsNewUser,
            } = qs.parse(hash.slice(1));

            // Validate query params
            const validatedParams = v.safeParse(authAccessTokenScheme, {
                accessToken,
                expiresIn: Number(expiresIn),
                tokenType,
                scope: WebAuth.AUTH_SCOPE,
            });
            if (!validatedParams.success) {
                throw new Error(`Invalid query params received from web authentication flow: ${JSON.stringify(v.flatten(validatedParams.issues))}.`);
            }

            // Match state
            if (authState !== state) {
                throw new Error('Invalid state received from web authentication flow.');
            }

            // Reset authentication state
            this.authState = null;

            // Authenticate user
            await this.auth.setAccessToken({
                accessToken: validatedParams.output.accessToken,
                expiresIn: validatedParams.output.expiresIn,
                tokenType: validatedParams.output.tokenType,
                scope: validatedParams.output.scope,
            });

            // Notify flags storage
            if (strIsNewUser === WebAuth.OAUTH_IS_NEW_USER_VALUE) {
                await this.flagsStorage.onRegister();
            } else {
                await this.flagsStorage.onAuthenticate();
            }

            // Clear auth cache
            this.authCache.clearCache();

            /**
             * Notify listeners.
             *
             * Note: We don't use USER_AUTHENTICATED event here, because
             * this event is used every time when access token is updated.
             * This event is only emitted when the web authentication flow
             * is completed successfully.
             */
            this.notifier.notifyListeners(this.notifier.types.WEB_AUTH_FLOW_AUTHENTICATED);

            // Finish with success web auth flow
            this.interpreter.send(WebAuthAction.Succeed);

            if (this.flowId === flowId) {
                this.flowId = null;
            }
        } catch (error) {
            await this.showErrorState({
                shouldCloseWebAuthTab: true,
                isCausedByTabModification: false,
                flowId,
                error,
            });
        } finally {
            if (this.finishingAuthState === authState) {
                this.finishingAuthState = null;
            }
        }
    }

    /** @inheritdoc */
    public async waitForInit(): Promise<void> {
        await this.initPromise;
    }

    /** @inheritdoc */
    public async handleAction(appId: string, action: WebAuthAction): Promise<void> {
        // Wait for the web authentication flow state to be restored
        await this.initPromise;

        // Get is loading state before sending action
        const isLoading = this.interpreter.getSnapshot().matches(WebAuthState.Loading);

        // Send action before async methods to reflect state in UI first
        this.interpreter.send(action);

        // Handle action
        switch (action) {
            case WebAuthAction.Start: {
                await this.startWebAuthFlow(appId);
                break;
            }
            // Reopen can be clicked only in `Loading` or `Opened` state,
            // depending on that, either start the flow or reopen existing tab.
            case WebAuthAction.Reopen: {
                if (isLoading) {
                    await this.reopenWebAuthFlow();
                } else {
                    await this.startWebAuthFlow(appId);
                }

                break;
            }
            case WebAuthAction.Cancel:
                await this.cancelWebAuthFlow();
                break;
            // We need to only update state when failure
            // dismissed, that's why we do nothing here
            case WebAuthAction.DismissFailure:
                break;
            default:
                throw new Error(`Unknown web authentication action: ${action}`);
        }
    }
}
