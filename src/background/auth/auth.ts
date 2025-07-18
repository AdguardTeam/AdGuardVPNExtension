import qs from 'qs';
import { nanoid } from 'nanoid';

import { SocialAuthProvider } from '../../common/constants';
import { log } from '../../common/logger';
import { notifier } from '../../common/notifier';
import { translator } from '../../common/translator';
import { authProvider } from '../providers/authProvider';
import { tabs } from '../tabs';
import { proxy } from '../proxy';
import { notifications } from '../notifications';
import { AUTH_CLIENT_ID } from '../config';
import { SUPPORT_EMAIL } from '../constants';
import { fallbackApi } from '../api/fallbackApi';
// eslint-disable-next-line import/no-cycle
import { settings } from '../settings';
import { flagsStorage } from '../flagsStorage';
import type { AuthCredentials } from '../api/apiTypes';
import { StorageKey, type AuthAccessToken, type AuthState } from '../schema';
import { authService } from '../authentication/authService';
import { stateStorage } from '../stateStorage';

import { type SocialAuthData } from './socialAuthSchema';
import { type ThankYouPageData, thankYouPageSchema } from './thankYouPageSchema';

export interface AuthInterface {
    authenticate(credentials: AuthCredentials): Promise<{ status: string }>;
    isAuthenticated(turnOffProxy?: boolean): Promise<boolean>;
    startSocialAuth(socialProvider: string, marketingConsent: boolean): Promise<void>;
    getImplicitAuthUrl(socialProvider: string, marketingConsent: boolean): Promise<string>;
    authenticateSocial(authData: SocialAuthData, tabId: number): Promise<void>;
    authenticateThankYouPage(rawData: unknown): Promise<void>;
    deauthenticate(): Promise<void>;
    register(
        credentials: AuthCredentials,
    ): Promise<{ status: string } | { error: string, field?: string }>;
    userLookup(
        email: string,
        appId: string,
    ): Promise<{ canRegister: string } | { error: string }>;
    resendEmailConfirmationCode(authId: string): Promise<void>;
    getAccessToken(turnOffProxy?: boolean): Promise<string>;
    init(): Promise<void>;
}

class Auth implements AuthInterface {
    /**
     * Promise that resolves when the authentication state is initialized.
     */
    private initStatePromise: Promise<void> | null = null;

    /**
     * Current authentication state.
     */
    private state: AuthState;

    private saveAuthState = () => {
        stateStorage.setItem(StorageKey.AuthState, this.state);
    };

    private get socialAuthState(): string | null {
        return this.state.socialAuthState;
    }

    private set socialAuthState(socialAuthState: string | null) {
        this.state.socialAuthState = socialAuthState;
        this.saveAuthState();
    }

    private get accessTokenData(): AuthAccessToken | null {
        return this.state.accessTokenData;
    }

    private set accessTokenData(accessTokenData: AuthAccessToken | null) {
        this.state.accessTokenData = accessTokenData;
        this.saveAuthState();
    }

    async authenticate(credentials: AuthCredentials): Promise<{ status: string }> {
        // turn off proxy to be sure it is not enabled before authentication
        try {
            await proxy.turnOff();
        } catch (e) {
            log.error(e.message);
        }

        let accessToken;
        try {
            accessToken = await authProvider.getAccessToken(credentials);
        } catch (e) {
            return JSON.parse(e.message);
        }

        await this.setAccessToken(accessToken);
        await flagsStorage.onAuthenticate();
        return { status: 'ok' };
    }

    /**
     * Checks if user is authenticated.
     *
     * @param turnOffProxy If true, turns off the proxy if no access token is found.
     *
     * @returns True if user is authenticated, false otherwise.
     */
    async isAuthenticated(turnOffProxy?: boolean): Promise<boolean> {
        /**
         * Wait for session storage after service worker awoken.
         * This is needed because this method might be called before
         * the extension is fully loaded between service worker restarts.
         */
        await this.initState();

        let accessToken;

        try {
            accessToken = await this.getAccessToken(turnOffProxy);
        } catch (e) {
            return false;
        }

        return !!accessToken;
    }

    async startSocialAuth(
        socialProvider: SocialAuthProvider,
        marketingConsent: boolean,
    ): Promise<void> {
        // turn off proxy to be sure it is not enabled before authentication
        try {
            await proxy.turnOff();
        } catch (e) {
            log.error(e.message);
        }

        // Generates uniq state id, which will be checked on the auth end
        this.socialAuthState = nanoid();
        const authUrl = await this.getImplicitAuthUrl(socialProvider, marketingConsent);
        await tabs.openSocialAuthTab(authUrl);
    }

    async getImplicitAuthUrl(socialProvider: string, marketingConsent: boolean): Promise<string> {
        const params = {
            response_type: 'token',
            client_id: AUTH_CLIENT_ID,
            redirect_uri: `https://${await fallbackApi.getAuthRedirectUri()}`,
            scope: 'trust',
            state: this.socialAuthState,
            social_provider: '',
            marketing_consent: false,
        };

        switch (socialProvider) {
            case SocialAuthProvider.Google: {
                params.social_provider = SocialAuthProvider.Google;
                break;
            }
            case SocialAuthProvider.Facebook: {
                params.social_provider = SocialAuthProvider.Facebook;
                break;
            }
            case SocialAuthProvider.Apple: {
                params.social_provider = SocialAuthProvider.Apple;
                break;
            }
            default:
                throw new Error(`There is no such provider: "${socialProvider}"`);
        }

        if (marketingConsent) {
            params.marketing_consent = marketingConsent;
        }

        return `https://${await fallbackApi.getAuthBaseUrl()}?${qs.stringify(params)}`;
    }

    /**
     * Authenticates a user using social auth data.
     *
     * @async
     * @param authData - Object containing the social authentication data.
     * @param tabId - The ID of the browser tab to close after successful authentication.
     */
    async authenticateSocial(authData: SocialAuthData, tabId: number): Promise<void> {
        const isAuthenticated = await this.isAuthenticated();
        if (isAuthenticated) {
            return;
        }

        const {
            state,
            accessToken,
            tokenType,
            expiresIn,
        } = authData;

        const isStateMatching = state && state === this.socialAuthState;
        if (!isStateMatching) {
            log.error('Social auth state is not equal to the state received from the server');
            return;
        }

        await this.setAccessToken({
            accessToken,
            expiresIn,
            tokenType,
        });
        await tabs.closeTab(tabId);
        this.socialAuthState = null;

        // Notify options page, in order to update view
        notifier.notifyListeners(notifier.types.AUTHENTICATE_SOCIAL_SUCCESS);

        await flagsStorage.onAuthenticateSocial();
        await notifications.create({ message: translator.getMessage('authentication_successful_notification') });
    }

    /**
     * Authenticate user after registration on thank you page
     * @param rawData
     */
    async authenticateThankYouPage(
        rawData: unknown,
    ): Promise<void> {
        let data: ThankYouPageData;
        try {
            data = thankYouPageSchema.parse(rawData);
        } catch (e) {
            log.error(`Unable to authenticate user, invalid params received from the page: ${JSON.stringify(rawData)}`);
            return;
        }

        const {
            token,
            newUser,
            redirectUrl,
        } = data;

        const isAuthenticated = await this.isAuthenticated();
        if (isAuthenticated) {
            await tabs.redirectCurrentTab(redirectUrl);
            return;
        }

        const credentials: AuthAccessToken = {
            accessToken: token,
            expiresIn: 60 * 60 * 24 * 30, //  30 days in seconds
            tokenType: 'Bearer',
        };

        await this.setAccessToken(credentials);

        if (newUser) {
            await flagsStorage.onRegister();
        } else {
            await flagsStorage.onAuthenticate();
        }

        await notifications.create({ message: translator.getMessage('authentication_successful_notification') });
        await tabs.redirectCurrentTab(redirectUrl);
    }

    async deauthenticate(): Promise<void> {
        try {
            await this.removeAccessToken();
        } catch (e) {
            log.error('Unable to remove access token. Error: ', e.message);
        }

        // turn off connection
        await settings.disableProxy(true);
        // set proxy settings to default
        await proxy.resetSettings();
        await flagsStorage.onDeauthenticate();
        notifier.notifyListeners(notifier.types.USER_DEAUTHENTICATED);
    }

    async register(
        credentials: AuthCredentials,
    ): Promise<{ status: string } | { error: string, field?: string, status?: string, authId?: string }> {
        const locale = navigator.language;
        let accessToken;
        try {
            accessToken = await authProvider.register({
                ...credentials,
                locale,
                clientId: AUTH_CLIENT_ID,
            });
        } catch (e) {
            const {
                error,
                field,
                status,
                authId,
            } = JSON.parse(e.message);
            return {
                error,
                field,
                status,
                authId,
            };
        }

        if (accessToken) {
            await this.setAccessToken(accessToken);
            await flagsStorage.onRegister();
            return { status: 'ok' };
        }

        return {
            error: translator.getMessage('global_error_message', {
                support_email: SUPPORT_EMAIL,
                a: (chunks: string) => `<a href="mailto:${SUPPORT_EMAIL}" target="_blank">${chunks}</a>`,
            }),
        };
    }

    /**
     * Checks if user had such email registered
     * @param email
     * @param appId
     */
    async userLookup(
        email: string,
        appId: string,
    ): Promise<{ canRegister: string } | { error: string }> {
        let response;
        try {
            response = await authProvider.userLookup(email, appId);
        } catch (e) {
            log.error(e.message);
            return {
                error: translator.getMessage('global_error_message', {
                    support_email: SUPPORT_EMAIL,
                    a: (chunks: string) => `<a href="mailto:${SUPPORT_EMAIL}" target="_blank">${chunks}</a>`,
                }),
            };
        }
        return response;
    }

    /**
     * Uses {@link authProvider} to request a new email confirmation code.
     *
     * @param authId Auth id received from the server previously.
     */
    async resendEmailConfirmationCode(authId: string): Promise<void> {
        await authProvider.resendEmailConfirmationCode(authId);
    }

    async setAccessToken(accessToken: AuthAccessToken): Promise<void> {
        this.accessTokenData = accessToken;
        await authService.saveAccessTokenData(accessToken);
        notifier.notifyListeners(notifier.types.USER_AUTHENTICATED);
    }

    async removeAccessToken(): Promise<void> {
        this.accessTokenData = null;
        await authService.removeAccessTokenData();
    }

    /**
     * Returns access token
     * If no token is available turns off, except of when turnOffProxy flag is false
     * @param [turnOffProxy=true] - if false do not turn off proxy
     */
    async getAccessToken(turnOffProxy = true): Promise<string> {
        if (this.accessTokenData && this.accessTokenData.accessToken) {
            return this.accessTokenData.accessToken;
        }

        // if no access token, then try to get it from storage
        const accessTokenData = await authService.getAccessTokenData();

        if (accessTokenData?.accessToken) {
            this.accessTokenData = accessTokenData;
            return this.accessTokenData.accessToken;
        }

        // if no access token found
        // 1. turn off proxy just in case
        if (turnOffProxy) {
            try {
                await proxy.turnOff();
            } catch (e) {
                log.error(e.message);
            }
        }

        // 2. throw error
        throw new Error('No access token, user is not authenticated');
    }

    /**
     * Initializes the authentication state by waiting for the state storage to be initialized
     * and then retrieving the current authentication state from state storage.
     */
    private async innerInitState(): Promise<void> {
        await stateStorage.init();
        this.state = stateStorage.getItem(StorageKey.AuthState);
    }

    /**
     * Initializes the state of the authentication module.
     *
     * Note: You can call this method to wait for the auth to be initialized,
     * because it was implemented as it can be called multiple times but
     * initialization will happen only once.
     *
     * @returns Promise that resolves when the auth is initialized.
     */
    public async initState(): Promise<void> {
        if (!this.initStatePromise) {
            this.initStatePromise = this.innerInitState();
        }

        return this.initStatePromise;
    }

    public async init(): Promise<void> {
        const accessTokenData = await authService.getAccessTokenData();
        if (!accessTokenData?.accessToken) {
            return;
        }

        this.accessTokenData = accessTokenData;
        notifier.notifyListeners(notifier.types.USER_AUTHENTICATED);
        log.info('Authentication module is ready');
    }
}

export const auth = new Auth();
