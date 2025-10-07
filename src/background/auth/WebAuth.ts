import browser, { type WebRequest } from 'webextension-polyfill';
import qs from 'qs';
import { nanoid } from 'nanoid';
import { interpret } from 'xstate';

import { AUTH_CLIENT_ID } from '../config';
import { log } from '../../common/logger';
import { authAccessTokenScheme } from '../schema/auth/authAccessToken';
import { AuthCacheKey } from '../authentication/authCacheTypes';
import { type FallbackApiInterface } from '../api/fallbackApi';
import { type FlagsStorageInterface } from '../flagsStorage';
import { type AuthCacheInterface } from '../authentication/authCache';
import { type NotifierInterface } from '../../common/notifier';
import { type TabsInterface } from '../tabs';
import { type WindowsApiInterface } from '../windowsApi';

import { type AuthInterface } from './auth';
import { webAuthMachine } from './webAuthMachine';
import { WebAuthAction, WebAuthState } from './webAuthEnums';

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
 * 7. Open new tab with constructed URL and save `tabId` and `windowId` to {@link webAuthTabInfo}.
 * 8. If something unexpected happens during Steps 2-7, we handle the error gracefully:
 *    - {@link authState} is set to `null`.
 *    - We close the web authentication tab if it was opened, also {@link webAuthTabInfo} is set to `null`.
 *    - State of flow changed to `WebAuthState.Failed`.
 * 9. User interacts with opened tab and authenticates.
 * 10. After successful authentication web redirects to `<redirectUri>`.
 * 11. We handle the redirect before request even happen in {@link handleOnBeforeRequest} method.
 * 12. Final `responseUrl` is received by {@link finishWebAuthFlow} method.
 * 13. Web authentication tab is closed, also {@link webAuthTabInfo} is set to `null`.
 * 14. We check current state of service:
 *   14.1. If {@link authState} is not defined - we can't match states, so we consider it as error state.
 *   14.2. If user is already authenticated - user needs to logout first, do nothing.
 * 15. Extract `hash` part from `responseUrl` and parse it as query params (thats how it passed from backend):
 *   15.1. Validate parsed query params, if everything is valid - continue further, otherwise throw an error.
 *   15.2. Match `state` param from query with {@link authState}, if not equal - throw an error.
 * 16. Reset {@link authState} to `null` - because no longer needed.
 * 17. Authenticate user with given access token via {@link auth.setAccessToken}.
 * 18. Modify flags storage:
 *   - If user logged in - call `flagsStorage.onAuthenticate()` to change appropriate flags,
 *   - If user registered - call `flagsStorage.onRegister()` to change appropriate flags.
 * 19. Clear {@link authCache} to reset flow state.
 * 20. Notify listeners that web auth flow finished and authenticated.
 *
 * We also track active authentication flow state (steps between 9-10):
 * - If user closes or moves away from web authentication tab to non-auth URLs:
 *    - {@link authState} is set to `null`.
 *    - {@link webAuthTabInfo} is set to `null`.
 *    - State of flow changed to `WebAuthState.FailedByUser`.
 * - If tab couldn't load URL due to network issues or other problems:
 *    - {@link authState} is set to `null`.
 *    - {@link webAuthTabInfo} is set to `null`.
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
     * Information about the web authentication tab.
     */
    private webAuthTabInfo: Pick<browser.Tabs.Tab, 'id' | 'windowId'> | null = null;

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
        this.handleTabAttached = this.handleTabAttached.bind(this);

        this.interpreter.onTransition((state) => {
            log.debug(`WebAuth state transitioned to "${state.value}"`);
            this.authCache.updateCache(AuthCacheKey.WebAuthFlowState, state.value as WebAuthState);
        });
        this.interpreter.start();
    }

    /**
     * Closes the web authentication tab if it's open.
     */
    private async closeWebAuthTab(): Promise<void> {
        // Do nothing if tab is not open
        const tabId = this.webAuthTabInfo?.id;
        if (typeof tabId !== 'number') {
            return;
        }

        // Clear web authentication tab info
        this.webAuthTabInfo = null;

        // Close tab
        try {
            await this.tabs.closeTab(tabId);
            log.debug(`Web authentication tab with tabId#${tabId} closed.`);
        } catch {
            // It might throw an error if the tab is already closed
        }
    }

    /**
     * Attaches web request event listeners needed for web authentication flow.
     *
     * @throws Error if {@link webAuthTabInfo} is not defined.
     */
    private async addWebRequestEventListeners(): Promise<void> {
        if (!this.webAuthTabInfo) {
            throw new Error('Cannot attach listeners, because web authentication tab info is not available.');
        }

        const webRequestOptions: Partial<WebRequest.RequestFilter> = {
            types: ['main_frame'],
            tabId: this.webAuthTabInfo.id,
            windowId: this.webAuthTabInfo.windowId,
        };

        browser.webRequest.onBeforeRequest.addListener(this.handleOnBeforeRequest, {
            ...webRequestOptions,
            urls: [`${WebAuth.OAUTH_REDIRECT_URL}*`],
        });

        const authApiUrl = `https://${await this.fallbackApi.getAuthApiUrl()}/*`;
        browser.webRequest.onErrorOccurred.addListener(this.handleOnErrorOccurred, {
            ...webRequestOptions,
            urls: [authApiUrl],
        });
    }

    /**
     * Attaches event listeners needed for web authentication flow.
     *
     * @throws Error if {@link webAuthTabInfo} is not defined.
     */
    private async addEventListeners(): Promise<void> {
        // Remove old listeners first if some of them already applied
        this.removeEventListeners();

        await this.addWebRequestEventListeners();
        browser.tabs.onRemoved.addListener(this.handleTabRemoved);
        browser.tabs.onReplaced.addListener(this.handleTabReplaced);
        browser.tabs.onAttached.addListener(this.handleTabAttached);
    }

    /**
     * Removes web request event listeners used for web authentication flow.
     */
    private removeWebRequestEventListeners(): void {
        browser.webRequest.onBeforeRequest.removeListener(this.handleOnBeforeRequest);
        browser.webRequest.onErrorOccurred.removeListener(this.handleOnErrorOccurred);
    }

    /**
     * Removes event listeners used for web authentication flow.
     */
    private removeEventListeners(): void {
        this.removeWebRequestEventListeners();

        browser.tabs.onRemoved.removeListener(this.handleTabRemoved);
        browser.tabs.onReplaced.removeListener(this.handleTabReplaced);
        browser.tabs.onAttached.removeListener(this.handleTabAttached);
    }

    /**
     * Handles error state during web authentication flow.
     *
     * @param shouldCloseWebAuthTab Whether the web authentication tab should be closed.
     * @param isCausedByTabModification Whether the error was caused by tab modification (closed or replaced).
     * @param error Handled error.
     */
    private async showErrorState({
        shouldCloseWebAuthTab,
        isCausedByTabModification,
        error,
    }: ShowErrorStateOptions): Promise<void> {
        if (error) {
            log.error('Error occurred while ongoing web authentication flow: ', error);
        }

        // Reset authentication state
        this.authState = null;

        // Close tab
        if (shouldCloseWebAuthTab) {
            await this.closeWebAuthTab();
        }

        // Remove listener
        this.removeEventListeners();

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
        // Do nothing if closed tab is not web auth tab
        if (this.webAuthTabInfo?.id !== tabId) {
            return;
        }

        log.debug(`User closed web authentication tab with tabId#${tabId}`);

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
     * Handles the attachment of a tab by updating web authentication tab info if necessary.
     *
     * @param tabId The ID of the attached tab.
     * @param attachInfo The attachment information for the attached tab.
     */
    private async handleTabAttached(tabId: number, attachInfo: browser.Tabs.OnAttachedAttachInfoType): Promise<void> {
        // Do nothing if attached tab is not web auth tab
        if (this.webAuthTabInfo?.id !== tabId) {
            return;
        }

        log.debug(`Web authentication tab with tabId#${tabId} was attached to windowId#${attachInfo.newWindowId}.`);

        // Update window ID
        this.webAuthTabInfo.windowId = attachInfo.newWindowId;

        // We should update web request listeners to listen to new window ID
        this.removeWebRequestEventListeners();
        await this.addWebRequestEventListeners();
    }

    /**
     * Handles errors occurred during web requests in the web authentication tab.
     *
     * @param details The details of the web request that caused the error.
     */
    private async handleOnErrorOccurred(details: WebRequest.OnErrorOccurredDetailsType): Promise<void> {
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

        // Show error state
        const error = new Error(`Web authentication tab encountered a web request error: ${details.error}`);
        await this.showErrorState({
            shouldCloseWebAuthTab: true,
            isCausedByTabModification: false,
            error,
        });
    }

    /**
     * Starts the web authentication flow.
     *
     * @param appId Application ID.
     */
    private async startWebAuthFlow(appId: string): Promise<void> {
        try {
            log.debug('Starting web authentication flow.');

            // If authentication state is defined - there is an ongoing flow
            if (this.authState) {
                log.debug('Web authentication flow is already in progress, skipping new request.');
                return;
            }

            // Do nothing if already authenticated - user must logout first
            if (await this.auth.isAuthenticated(false)) {
                log.debug('User is already authenticated, skipping web authentication request.');
                return;
            }

            // Generate new authentication state
            this.authState = nanoid();

            // Construct web authentication URL
            const authApiUrl = `https://${await this.fallbackApi.getAuthApiUrl()}`;
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
            log.debug(`Opening web authentication with "${webAuthUrl}" URL in new tab.`);
            const tab = await this.tabs.openTab(webAuthUrl);
            log.debug(`Web authentication tab with tabId#${tab.id} and windowId#${tab.windowId} opened.`);

            // Save tab ID and window ID to be able to manage it later
            this.webAuthTabInfo = {
                id: tab.id,
                windowId: tab.windowId,
            };

            // Attach event listeners
            await this.addEventListeners();
        } catch (error) {
            await this.showErrorState({
                shouldCloseWebAuthTab: true,
                isCausedByTabModification: false,
                error,
            });
        }
    }

    /**
     * Reopens the web authentication flow.
     */
    private async reopenWebAuthFlow(): Promise<void> {
        try {
            log.debug('Reopening web authentication tab');

            // If tab info is unavailable - nothing to reopen
            if (!this.webAuthTabInfo) {
                log.debug('Web authentication tab is not available for reopening.');
                return;
            }

            // Focus on window
            if (typeof this.webAuthTabInfo.windowId === 'number') {
                log.debug(`Focusing on web authentication window with windowId#${this.webAuthTabInfo.windowId}.`);
                await this.windowsApi.update(this.webAuthTabInfo.windowId, { focused: true });
            }

            // Focus on tab
            if (typeof this.webAuthTabInfo.id === 'number') {
                log.debug(`Focusing on web authentication tab with tabId#${this.webAuthTabInfo.id}.`);
                await this.tabs.focusTab(this.webAuthTabInfo.id);
            }
        } catch (error) {
            log.error('Error occurred while reopening web authentication flow: ', error);
        }
    }

    /**
     * Cancels the web authentication flow.
     */
    private async cancelWebAuthFlow(): Promise<void> {
        try {
            log.debug('Cancelling web authentication flow.');

            // Reset authentication state
            this.authState = null;

            // Close tab if it was opened
            await this.closeWebAuthTab();

            // Remove listeners if it was attached
            this.removeEventListeners();
        } catch (error) {
            log.error('Error occurred while cancelling web authentication flow: ', error);
        }
    }

    /**
     * Handle the onBeforeRequest event.
     *
     * @param details The details of the web request.
     */
    private handleOnBeforeRequest(details: WebRequest.OnBeforeRequestDetailsType): void {
        /**
         * Note 1: We don't need to handle success / error here because it was done by method itself.
         * Note 2: do not log `details` or `details.url`, because it contains sensitive information (token).
         */
        this.finishWebAuthFlow(details.url);
    }

    /**
     * Callback for the web authentication flow.
     *
     * @param responseUrl The response URL from the authentication flow.
     */
    private async finishWebAuthFlow(responseUrl: string): Promise<void> {
        try {
            // Note: do not log `responseUrl`, because it contains sensitive information (token)
            log.debug('Response URL received for web authentication flow, authenticating user.');

            // Close tab
            await this.closeWebAuthTab();

            // Remove listeners
            this.removeEventListeners();

            // If authentication state is not defined - we can't match states for validity
            if (!this.authState) {
                throw new Error('Authentication state is not set. Please start the web authentication flow first.');
            }

            // Do nothing if already authenticated - user must logout first
            if (await this.auth.isAuthenticated(false)) {
                log.debug('User is already authenticated, skipping web authentication request.');
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
            const validatedParams = authAccessTokenScheme.safeParse({
                accessToken,
                expiresIn: Number(expiresIn),
                tokenType,
                scope: WebAuth.AUTH_SCOPE,
            });
            if (!validatedParams.success) {
                throw new Error(`Invalid query params received from web authentication flow: ${validatedParams.error.message}.`);
            }

            // Match state
            if (this.authState !== state) {
                throw new Error('Invalid state received from web authentication flow.');
            }

            // Reset authentication state
            this.authState = null;

            // Authenticate user
            await this.auth.setAccessToken({
                accessToken: validatedParams.data.accessToken,
                expiresIn: validatedParams.data.expiresIn,
                tokenType: validatedParams.data.tokenType,
                scope: validatedParams.data.scope,
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
        } catch (error) {
            await this.showErrorState({
                shouldCloseWebAuthTab: true,
                isCausedByTabModification: false,
                error,
            });
        }
    }

    /** @inheritdoc */
    public async handleAction(appId: string, action: WebAuthAction): Promise<void> {
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
