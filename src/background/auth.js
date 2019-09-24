import qs from 'qs';
import isEmpty from 'lodash/isEmpty';
import nanoid from 'nanoid';
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

class Auth {
    socialAuthState = null;

    async authenticate(credentials) {
        let accessTokenData;
        try {
            accessTokenData = await authProvider.getAccessToken(credentials);
        } catch (e) {
            return JSON.parse(e.message);
        }

        await storage.set(AUTH_ACCESS_TOKEN_KEY, accessTokenData);

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
            await storage.set(AUTH_ACCESS_TOKEN_KEY, {
                accessToken,
                expiresIn,
                tokenType,
            });
            await tabs.closeTab(tabId);
            this.socialAuthState = null;
        }

        await notifications.create({ message: 'Successfully authenticated' });
    }

    // TODO [maximtop] set default values to proxy
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
        await proxy.setDefaults();
    }

    async register(credentials) {
        const locale = navigator.language;
        try {
            // TODO [maximtop] prepare returned data in the providers
            await authApi.register({ ...credentials, locale });
        } catch (e) {
            const { error, error_description: errorDescription, field } = JSON.parse(e.message);
            const extensionField = field === 'email' ? 'username' : field;
            return { error, errorDescription, field: extensionField };
        }
        return this.authenticate(credentials);
    }

    async getAccessToken() {
        const accessTokenData = await storage.get(AUTH_ACCESS_TOKEN_KEY);
        if (accessTokenData && accessTokenData.accessToken) {
            return accessTokenData.accessToken;
        }
        return null;
    }
}

const auth = new Auth();

export default auth;
