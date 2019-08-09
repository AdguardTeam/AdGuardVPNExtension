import qs from 'qs';
import isEmpty from 'lodash/isEmpty';
import nanoid from 'nanoid';
import { authApi } from './api';
import storage from './storage';
import tabs from './tabs';
import notifications from './notifications';

class Auth {
    accessTokenKey = 'accessToken';

    CLIENT_ID = 'adguard-vpn-extension';

    BASE_AUTH_URL = 'https://testauth.adguard.com/oauth/authorize';

    REDIRECT_URI = 'https://testauth.adguard.com/oauth.html';

    socialAuthState = null;

    async authenticate(credentials) {
        let data;
        try {
            // TODO [maximtop] prepare returned data in the provider
            data = await authApi.getAccessToken(credentials);
        } catch (e) {
            const { error, error_description: errorDescription } = JSON.parse(e.message);
            if (error === '2fa_required') {
                return { status: error };
            }
            return { error, errorDescription };
        }
        const {
            access_token: accessToken,
            expires_in: expiresIn,
            scope,
            token_type: tokenType,
        } = data;
        await storage.set(this.accessTokenKey, {
            accessToken,
            expiresIn,
            scope,
            tokenType,
        });
        return { status: 'ok' };
    }

    async isAuthenticated() {
        const accessToken = await storage.get(this.accessTokenKey);
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
            client_id: this.CLIENT_ID,
            redirect_uri: this.REDIRECT_URI,
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
            default:
                throw new Error(`There is no such provider: "${socialProvider}"`);
        }

        return `${this.BASE_AUTH_URL}?${qs.stringify(params)}`;
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
            await storage.set(this.accessTokenKey, {
                accessToken,
                expiresIn,
                tokenType,
            });
            await tabs.closeTab(tabId);
            this.socialAuthState = null;
        }
        await notifications.create({ message: 'Successfully authenticated' });
    }

    // TODO [maximtop] revoke accessToken from the api
    // TODO [maximtop] set default values to proxy
    async deauthenticate() {
        await storage.remove(this.accessTokenKey);
    }

    async register(credentials) {
        let data;
        const locale = navigator.language;
        try {
            // TODO [maximtop] prepare returned data in the provider
            data = await authApi.register({ ...credentials, locale });
        } catch (e) {
            const { error, errorMessage: errorDescription, field } = JSON.parse(e.message);
            const extensionField = field === 'email' ? 'username' : field;
            return { error, errorDescription, field: extensionField };
        }
        // TODO [maximtop] registration returns empty object, consider how to handle it
        const {
            access_token: accessToken,
            expires_in: expiresIn,
            scope,
            token_type: tokenType,
        } = data;
        await storage.set(this.accessTokenKey, {
            accessToken,
            expiresIn,
            scope,
            tokenType,
        });
        return { status: 'ok' };
    }
}

const auth = new Auth();

export default auth;
