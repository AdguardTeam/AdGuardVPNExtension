import browser from 'webextension-polyfill';
import qs from 'qs';
import { nanoid } from 'nanoid';

import { AUTH_CLIENT_ID, FORWARDER_URL_QUERIES } from '../config';
import { log } from '../../common/logger';
import { type FallbackApiInterface } from '../api/fallbackApi';
import { type FlagsStorageInterface } from '../flagsStorage';
import { authAccessTokenScheme } from '../schema/auth/authAccessToken';
import { type AuthCacheInterface } from '../authentication/authCache';
import { AuthCacheKey } from '../authentication/authCacheTypes';
import { getErrorMessage } from '../../common/utils/error';
import { type NotificationsInterface } from '../notifications';
import { translator } from '../../common/translator';
import { type UpdateServiceInterface } from '../updateService';
import { getForwarderUrl } from '../../common/helpers';
import { type ForwarderInterface } from '../forwarder/forwarder';

import { type AuthInterface } from './auth';

/**
 * WebAuth interface.
 */
export interface WebAuthInterface {
    /**
     * Starts the web authentication flow.
     *
     * @param appId Application ID.
     * @param marketingConsent Whether the user accepted marketing consent.
     */
    startWebAuthFlow(appId: string, marketingConsent: boolean): Promise<void>;

    /**
     * Reopens the web authentication flow.
     */
    reopenWebAuthFlow(): Promise<void>;

    /**
     * Cancels the web authentication flow.
     */
    cancelWebAuthFlow(): Promise<void>;
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
     * Notifications service.
     */
    notifications: NotificationsInterface;

    /**
     * Update service.
     */
    updateService: UpdateServiceInterface;

    /**
     * Forwarder service.
     */
    forwarder: ForwarderInterface;

    /**
     * Fallback API.
     */
    fallbackApi: FallbackApiInterface;
}

/**
 * Web authentication service.
 * This service handles the web authentication flow using the browser's identity API where it's supported.
 * Or falls back to a custom implementation which opens new tab and callback URL is set to extension's page.
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
     * Error message thrown by Identity API if request is denied by user.
     */
    private static readonly USER_DENIAL_ERROR_MESSAGE = 'The user did not approve access.';

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
     * Notifications service.
     */
    private notifications: NotificationsInterface;

    /**
     * Update service.
     */
    private updateService: UpdateServiceInterface;

    /**
     * Forwarder service.
     */
    private forwarder: ForwarderInterface;

    /**
     * Fallback API.
     */
    private fallbackApi: FallbackApiInterface;

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
        notifications,
        updateService,
        forwarder,
        fallbackApi,
    }: WebAuthParameters) {
        this.auth = auth;
        this.authCache = authCache;
        this.flagsStorage = flagsStorage;
        this.notifications = notifications;
        this.updateService = updateService;
        this.forwarder = forwarder;
        this.fallbackApi = fallbackApi;

        browser.tabs.onCreated.addListener(this.handleTabCreated.bind(this));
    }

    /**
     * Handles the creation of a new tab by saving info about it if it's a web authentication tab.
     *
     * @param tab The created tab.
     */
    private async handleTabCreated(tab: browser.Tabs.Tab): Promise<void> {
        // Check if authentication state is set, state is set
        // only when there are ongoing web authentication flow
        if (!this.authState) {
            return;
        }

        // If tab info already exists - no need to check it further
        if (this.webAuthTabInfo) {
            return;
        }

        // Check if the tab URL is a web authentication URL
        const authApiUrl = await this.fallbackApi.getAuthApiUrl();
        if (!tab.url || !tab.url.startsWith(`https://${authApiUrl}`)) {
            return;
        }

        // Save info about this tab
        this.webAuthTabInfo = {
            id: tab.id,
            windowId: tab.windowId,
        };
    }

    /**
     * Authenticates the user with given response URL.
     * This method will extract the access token from the response URL and validates parameters.
     * After it sets the access token in the auth service.
     *
     * @param responseUrl The response URL from the web authentication flow.
     */
    private async authenticate(responseUrl: string): Promise<void> {
        // Check if authentication state is set
        if (!this.authState) {
            throw new Error('Authentication state is not set. Please start the web authentication flow first.');
        }

        // If already authenticated, throw an error and do not continue further
        if (await this.auth.isAuthenticated()) {
            throw new Error('User is already authenticated, skipping web authentication flow.');
        }

        // Get hash from URL, because that's how it passed from backend
        const { hash } = new URL(responseUrl);

        // Parse query string
        const {
            access_token: accessToken,
            expires_in: expiresIn,
            token_type: tokenType,
            state,
            is_new_user: isNewUser,
        } = qs.parse(hash.slice(1));

        // Validate query params
        const validatedParams = authAccessTokenScheme.safeParse({
            accessToken,
            expiresIn: Number(expiresIn),
            tokenType,
            scope: WebAuth.AUTH_SCOPE,
        });

        if (!validatedParams.success) {
            throw new Error(`Invalid query params received from web authentication flow: ${validatedParams.error}`);
        }

        // Match state
        if (this.authState !== state) {
            throw new Error('Invalid state received from web authentication flow');
        }

        // Reset authentication state
        this.authState = null;

        // Reset web authentication tab info
        this.webAuthTabInfo = null;

        // Authenticate user
        await this.auth.setAccessToken({
            accessToken: validatedParams.data.accessToken,
            expiresIn: validatedParams.data.expiresIn,
            tokenType: validatedParams.data.tokenType,
            scope: validatedParams.data.scope,
        });

        // Notify flags storage
        if (isNewUser) {
            this.flagsStorage.onRegister();
        } else {
            this.flagsStorage.onAuthenticate();
        }

        // Clear auth cache
        this.authCache.clearCache();

        // Notify user
        await this.notifications.create({
            message: translator.getMessage('authentication_successful_notification'),
        });

        // Open compare page only on first run
        if (this.updateService.getIsFirstRun()) {
            const forwarderDomain = await this.forwarder.updateAndGetDomain();
            const comparePageUrl = getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.COMPARE_PAGE);
            await browser.tabs.create({ url: comparePageUrl, active: true });
        }
    }

    /**
     * Checks if the error is a user denial error.
     *
     * @param error The error to check.
     *
     * @returns True if the error is a user denial error, false otherwise.
     */
    private static isUserDenialError(error: unknown): boolean {
        const message = getErrorMessage(error);
        return message === WebAuth.USER_DENIAL_ERROR_MESSAGE;
    }

    /**
     * Opens the web authentication flow with following logic:
     * 1. Generate a web authentication URL for Identity API usage.
     * 2. Try to open the web authentication flow with Identity API.
     * 3. If Identity API supported and successful, return the response URL.
     * 4. If Identity API not supported or failed, generate a web authentication URL for the fallback flow.
     * 5. Open the fallback web authentication flow.
     *
     * @param appId Application ID.
     * @param marketingConsent Whether the user accepted marketing consent.
     *
     * @returns Response URL after success authentication if Identity API was supported and used, null otherwise.
     */
    private async openWebAuthFlow(appId: string, marketingConsent: boolean): Promise<string | null> {
        // Get authentication base URL
        const authBaseUrl = `https://${await this.fallbackApi.getAuthBaseUrl()}`;
        const commonParams = {
            client_id: AUTH_CLIENT_ID,
            response_type: WebAuth.AUTH_RESPONSE_TYPE,
            scope: WebAuth.AUTH_SCOPE,
            state: this.authState,
            marketing_consent: marketingConsent,
            app_id: appId,
        };

        try {
            // Build params
            const params = qs.stringify({
                ...commonParams,
                redirect_uri: browser.identity.getRedirectURL('callback'),
            });

            // Build URL
            const webAuthUrl = `${authBaseUrl}?${params}`;
            log.debug(`Opening web authentication flow at "${webAuthUrl}" with Identity API`);

            // FIXME: Remove after implementation
            throw new Error('f --- IGNORE ---');

            // Open web authentication flow
            const responseUrl = await browser.identity.launchWebAuthFlow({
                url: webAuthUrl,
                interactive: true,
            });

            return responseUrl;
        } catch (e) {
            // Re-throw error if it's a user denial
            if (WebAuth.isUserDenialError(e)) {
                throw e;
            }

            // Otherwise open fallback web authentication flow
            log.debug('Identity API failed with error, using fallback flow:', e);

            // Build params
            const params = qs.stringify({
                ...commonParams,
                redirect_uri: browser.runtime.getURL('callback.html'),
            });

            // Build URL
            const webAuthUrl = `${authBaseUrl}?${params}`;
            log.debug(`Opening web authentication flow at "${webAuthUrl}" with callback page`);

            // Open web authentication flow
            const tab = await browser.tabs.create({ url: webAuthUrl, active: true });

            // Save info about tab
            this.webAuthTabInfo = {
                id: tab.id,
                windowId: tab.windowId,
            };

            return null;
        }
    }

    /** @inheritdoc */
    public async startWebAuthFlow(appId: string, marketingConsent: boolean): Promise<void> {
        try {
            log.debug('Starting web authentication flow...');

            // Check if authentication flow is already in progress
            if (this.authState) {
                log.debug('Web authentication flow is already in progress, skipping new request.');
                return;
            }

            // If already authenticated, return true and do not continue further
            if (await this.auth.isAuthenticated()) {
                log.debug('User is already authenticated, skipping web authentication flow.');
                return;
            }

            // Mark authentication flow as started and loading
            this.authCache.updateCache(AuthCacheKey.IsWebAuthFlowStarted, true);
            this.authCache.updateCache(AuthCacheKey.IsWebAuthFlowLoading, true);

            // Generate a new state for the authentication flow
            this.authState = nanoid();

            // Open web authentication flow
            const responseUrl = await this.openWebAuthFlow(appId, marketingConsent);

            // Authenticate user and reset auth caches
            // only if authentication was successful via identity
            if (responseUrl) {
                await this.authenticate(responseUrl);
            }
        } catch (error) {
            // Log error message only if it's not a user denial
            if (!WebAuth.isUserDenialError(error)) {
                log.error('Error occurred during web authentication flow:', error);
            }

            // Reset authentication state
            this.authState = null;

            // Mark error as true and finish loading only if it was not canceled by user
            const { isWebAuthFlowStarted } = this.authCache.getCache();
            if (isWebAuthFlowStarted) {
                this.authCache.updateCache(AuthCacheKey.IsWebAuthFlowHasError, true);
                this.authCache.updateCache(AuthCacheKey.IsWebAuthFlowLoading, false);
            }
        }
    }

    /** @inheritdoc */
    public async reopenWebAuthFlow(): Promise<void> {
        // Check if the web authentication tab info is available
        if (!this.webAuthTabInfo) {
            return;
        }

        // Focus the window if web auth opened in separate window
        if (typeof this.webAuthTabInfo.windowId === 'number') {
            await chrome.windows.update(this.webAuthTabInfo.windowId, { focused: true });
        }

        // Focus the tab if web auth
        if (typeof this.webAuthTabInfo.id === 'number') {
            await chrome.tabs.update(this.webAuthTabInfo.id, { active: true });
        }
    }

    /** @inheritdoc */
    public async cancelWebAuthFlow(): Promise<void> {
        // Reset authentication state
        this.authState = null;

        // Mark everything as not in progress
        this.authCache.updateCache(AuthCacheKey.IsWebAuthFlowStarted, false);
        this.authCache.updateCache(AuthCacheKey.IsWebAuthFlowLoading, false);
        this.authCache.updateCache(AuthCacheKey.IsWebAuthFlowHasError, false);

        // Close web authentication tab if it exists
        if (this.webAuthTabInfo && typeof this.webAuthTabInfo.id === 'number') {
            await browser.tabs.remove(this.webAuthTabInfo.id);
            this.webAuthTabInfo = null;
        }
    }
}
