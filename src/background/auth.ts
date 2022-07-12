import qs from 'qs';
import { nanoid } from 'nanoid';

import authProvider from './providers/authProvider';
import browserApi from './browserApi';
import tabs from './tabs';
import { proxy } from './proxy';
import { notifications } from './notifications';
import {
    AUTH_ACCESS_TOKEN_KEY,
    AUTH_CLIENT_ID,
} from './config';
import { log } from '../lib/logger';
import notifier from '../lib/notifier';
import { translator } from '../common/translator';
import { fallbackApi } from './api/fallbackApi';
// eslint-disable-next-line import/no-cycle
import { settings } from './settings';
import { AUTH_PROVIDERS } from '../lib/constants';
import { flagsStorage } from './flagsStorage';

interface AccessTokenInterface {
    accessToken: string;
    expiresIn: string;
    tokenType: string;
}

interface CredentialsInterface {
    username: string;
    password: string;
    twoFactor: string;
}

interface AuthInterface {
    authenticate(credentials: CredentialsInterface): Promise<{ status: string }>;
    isAuthenticated(turnOffProxy?: boolean): Promise<string | boolean>;
    startSocialAuth(socialProvider: string, marketingConsent: boolean): Promise<void>;
    getImplicitAuthUrl(socialProvider: string, marketingConsent: boolean): Promise<string>;
    authenticateSocial(queryString: string, tabId: number): Promise<void>;
    authenticateThankYouPage(credentials: AccessTokenInterface, isNewUser: boolean): Promise<void>;
    deauthenticate(): Promise<void>;
    register(
        credentials: CredentialsInterface,
    ): Promise<{ status: string } | { error: string, field?: string }>;
    userLookup(
        email: string,
        appId: string,
    ): Promise<{ canRegister: string } | { error: string }>;
    getAccessToken(turnOffProxy: boolean): Promise<string>;
    init(): Promise<void>;
}

class Auth implements AuthInterface {
    socialAuthState: string | null = null;

    accessTokenData: AccessTokenInterface | null = null;

    async authenticate(credentials: CredentialsInterface): Promise<{ status: string }> {
        // turn off proxy to be sure it is not enabled before authentication
        try {
            await proxy.turnOff();
        } catch (e: any) {
            log.error(e.message);
        }

        let accessToken;
        try {
            accessToken = await authProvider.getAccessToken(credentials);
        } catch (e: any) {
            return JSON.parse(e.message);
        }

        await this.setAccessToken(accessToken);
        await flagsStorage.onAuthenticate();
        return { status: 'ok' };
    }

    async isAuthenticated(turnOffProxy?: boolean): Promise<string | boolean> {
        let accessToken;

        try {
            accessToken = await this.getAccessToken(turnOffProxy);
        } catch (e) {
            return false;
        }

        return accessToken;
    }

    async startSocialAuth(socialProvider: string, marketingConsent: boolean): Promise<void> {
        // turn off proxy to be sure it is not enabled before authentication
        try {
            await proxy.turnOff();
        } catch (e: any) {
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
            case AUTH_PROVIDERS.GOOGLE: {
                params.social_provider = AUTH_PROVIDERS.GOOGLE;
                break;
            }
            case AUTH_PROVIDERS.FACEBOOK: {
                params.social_provider = AUTH_PROVIDERS.FACEBOOK;
                break;
            }
            case AUTH_PROVIDERS.APPLE: {
                params.social_provider = AUTH_PROVIDERS.APPLE;
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

    async authenticateSocial(queryString: string, tabId: number): Promise<void> {
        const data = qs.parse(queryString);
        const {
            access_token: accessToken,
            expires_in: expiresIn,
            token_type: tokenType,
            state,
        } = data;

        if (typeof accessToken !== 'string'
        || typeof expiresIn !== 'string'
        || typeof tokenType !== 'string') {
            throw new Error('Unable to get auth credentials, user is not authenticated');
        }

        if (state && state === this.socialAuthState) {
            await this.setAccessToken({
                accessToken,
                expiresIn,
                tokenType,
            });
            await tabs.closeTab(tabId);
            this.socialAuthState = null;
        }

        // Notify options page, in order to update view
        notifier.notifyListeners(notifier.types.AUTHENTICATE_SOCIAL_SUCCESS);
        await flagsStorage.onAuthenticateSocial();
        await notifications.create({ message: translator.getMessage('authentication_successful_notification') });
    }

    /**
     * Authenticate user after registration on thank you page
     * @param credentials
     * @param isNewUser
     * @returns {Promise<void>}
     */
    async authenticateThankYouPage(
        credentials: AccessTokenInterface,
        isNewUser: boolean,
    ): Promise<void> {
        await this.setAccessToken(credentials);

        if (isNewUser) {
            await flagsStorage.onRegister();
        } else {
            await flagsStorage.onAuthenticate();
        }
        await notifications.create({ message: translator.getMessage('authentication_successful_notification') });
    }

    async deauthenticate(): Promise<void> {
        try {
            await this.removeAccessToken();
        } catch (e: any) {
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
        credentials: CredentialsInterface,
    ): Promise<{ status: string } | { error: string, field?: string }> {
        const locale = navigator.language;
        let accessToken;
        try {
            accessToken = await authProvider.register({
                ...credentials,
                locale,
                clientId: AUTH_CLIENT_ID,
            });
        } catch (e: any) {
            const { error, field } = JSON.parse(e.message);
            return { error, field };
        }

        if (accessToken) {
            await this.setAccessToken(accessToken);
            await flagsStorage.onRegister();
            return { status: 'ok' };
        }

        return {
            error: translator.getMessage('global_error_message', {
                a: (chunks: string) => `<a href="mailto:support@adguard-vpn.com" target="_blank">${chunks}</a>`,
            }),
        };
    }

    /**
     * Checks if user had such email registered
     * @param {string} email
     * @param {string} appId
     * @returns {Promise<{canRegister: string}|{error: string}>}
     */
    async userLookup(
        email: string,
        appId: string,
    ): Promise<{ canRegister: string } | { error: string }> {
        let response;
        try {
            response = await authProvider.userLookup(email, appId);
        } catch (e: any) {
            log.error(e.message);
            return {
                error: translator.getMessage('global_error_message', {
                    a: (chunks: string) => `<a href="mailto:support@adguard-vpn.com" target="_blank">${chunks}</a>`,
                }),
            };
        }
        return response;
    }

    async setAccessToken(accessToken: AccessTokenInterface): Promise<void> {
        this.accessTokenData = accessToken;
        await browserApi.storage.set(AUTH_ACCESS_TOKEN_KEY, accessToken);
        notifier.notifyListeners(notifier.types.USER_AUTHENTICATED);
    }

    async removeAccessToken(): Promise<void> {
        this.accessTokenData = null;
        await browserApi.storage.remove(AUTH_ACCESS_TOKEN_KEY);
    }

    /**
     * Returns access token
     * If no token is available turns off, except of when turnOffProxy flag is false
     * @param {boolean} [turnOffProxy=true] - if false do not turns off proxy
     * @returns {Promise<string>}
     */
    async getAccessToken(turnOffProxy = true): Promise<string> {
        if (this.accessTokenData && this.accessTokenData.accessToken) {
            return this.accessTokenData.accessToken;
        }

        // if no access token, than try to get it from storage
        const accessTokenData = await browserApi.storage.get(AUTH_ACCESS_TOKEN_KEY);
        if (accessTokenData && accessTokenData.accessToken) {
            this.accessTokenData = accessTokenData;
            return accessTokenData.accessToken;
        }

        // if no access token found
        // 1. turn off proxy just in case
        if (turnOffProxy) {
            try {
                await proxy.turnOff();
            } catch (e: any) {
                log.error(e.message);
            }
        }

        // 2. throw error
        throw new Error('No access token, user is not authenticated');
    }

    async init(): Promise<void> {
        const accessTokenData = await browserApi.storage.get(AUTH_ACCESS_TOKEN_KEY);
        if (!accessTokenData || !accessTokenData.accessToken) {
            return;
        }
        this.accessTokenData = accessTokenData;
        notifier.notifyListeners(notifier.types.USER_AUTHENTICATED);
        log.info('Authentication module is ready');
    }
}

const auth = new Auth();

export default auth;
