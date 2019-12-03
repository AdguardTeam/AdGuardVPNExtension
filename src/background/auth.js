import qs from 'qs';
import isEmpty from 'lodash/isEmpty';
import nanoid from 'nanoid';
import browser from 'webextension-polyfill';
import { authApi } from './api';
import authProvider from './providers/authProvider';
import storage from './storage';
import tabs from './tabs';
import { proxy } from './proxy';
import notifications from './notifications';
import {
    AUTH_ACCESS_TOKEN_KEY,
    AUTH_CLIENT_ID,
    AUTH_BASE_URL,
    AUTH_REDIRECT_URI,
} from './config';
import browserApi from './browserApi';
import { MESSAGES_TYPES } from '../lib/constants';
import log from '../lib/logger';
import notifier from '../lib/notifier';

class Auth {
    socialAuthState = null;

    async authenticate(credentials) {
        let accessToken;
        try {
            accessToken = await authProvider.getAccessToken(credentials);
        } catch (e) {
            return JSON.parse(e.message);
        }

        await this.setAccessToken(accessToken);

        return { status: 'ok' };
    }

    async isAuthenticated() {
        const accessToken = await storage.get(AUTH_ACCESS_TOKEN_KEY);
        return !isEmpty(accessToken);
    }

    async startSocialAuth(socialProvider) {
        // Generates uniq state id, which will be checked on the auth end
        this.socialAuthState = nanoid();
        const authUrl = this.getImplicitAuthUrl(socialProvider);
        await tabs.openSocialAuthTab(authUrl);
    }

    getImplicitAuthUrl(socialProvider) {
        const params = {
            response_type: 'token',
            client_id: AUTH_CLIENT_ID,
            redirect_uri: AUTH_REDIRECT_URI,
            scope: 'trust',
            state: this.socialAuthState,
        };

        switch (socialProvider) {
            case 'google': {
                params.social_provider = 'google';
                break;
            }
            case 'twitter': {
                params.social_provider = 'twitter';
                break;
            }
            case 'vk': {
                params.social_provider = 'vk';
                break;
            }
            case 'yandex': {
                params.social_provider = 'yandex';
                break;
            }
            case 'facebook': {
                params.social_provider = 'facebook';
                break;
            }
            default:
                throw new Error(`There is no such provider: "${socialProvider}"`);
        }

        return `${AUTH_BASE_URL}?${qs.stringify(params)}`;
    }

    async authenticateSocial(queryString, tabId) {
        const data = qs.parse(queryString);
        const {
            access_token: accessToken,
            expires_in: expiresIn,
            token_type: tokenType,
            state,
        } = data;

        if (state && state === this.socialAuthState) {
            await this.setAccessToken({
                accessToken,
                expiresIn,
                tokenType,
            });
            await tabs.closeTab(tabId);
            this.socialAuthState = null;
        }
        await browserApi.runtime.sendMessage({
            type: MESSAGES_TYPES.AUTHENTICATE_SOCIAL_SUCCESS,
            data: true,
        });

        await notifications.create({ message: browser.i18n.getMessage('authentication_successful_social') });
    }

    async deauthenticate() {
        const token = await storage.get(AUTH_ACCESS_TOKEN_KEY);

        // remove token from storage
        await storage.remove(AUTH_ACCESS_TOKEN_KEY);

        // revoke token from api
        const accessToken = token && token.accessToken;
        if (accessToken) {
            await authApi.revokeToken(accessToken);
        }

        // set proxy settings to default
        await proxy.resetSettings();
        notifier.notifyListeners(notifier.types.USER_DEAUTHENTICATED);
    }

    async register(credentials) {
        const locale = navigator.language;
        let accessToken;
        try {
            accessToken = await authProvider.register({
                ...credentials,
                locale,
                clientId: AUTH_CLIENT_ID,
            });
        } catch (e) {
            const { error, field } = JSON.parse(e.message);
            return { error, field };
        }

        if (accessToken) {
            await this.setAccessToken(accessToken);
            return { status: 'ok' };
        }

        return { error: browser.i18n.getMessage('global_error_message') };
    }

    async setAccessToken(accessToken) {
        this.accessTokenData = accessToken;
        await storage.set(AUTH_ACCESS_TOKEN_KEY, accessToken);
        notifier.notifyListeners(notifier.types.USER_AUTHENTICATED);
    }

    async getAccessToken() {
        if (this.accessTokenData && this.accessTokenData.accessToken) {
            return this.accessTokenData.accessToken;
        }

        // if no access token, than try to get it from storage
        const accessTokenData = await storage.get(AUTH_ACCESS_TOKEN_KEY);
        if (accessTokenData && accessTokenData.accessToken) {
            return accessTokenData.accessToken;
        }

        // if no access token throw error
        throw new Error('No access token, user is not authenticated');
    }

    async init() {
        const accessTokenData = await storage.get(AUTH_ACCESS_TOKEN_KEY);
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
