import qs from 'qs';
import isEmpty from 'lodash/isEmpty';
import { authApi } from './api';
import storage from './storage';
import tabs from './tabs';

class Auth {
    accessTokenKey = 'accessToken';

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

    async authenticateSocial(queryString, tabId) {
        const data = qs.parse(queryString);
        const {
            access_token: accessToken,
            expires_in: expiresIn,
            token_type: tokenType,
        } = data;
        await storage.set(this.accessTokenKey, {
            accessToken,
            expiresIn,
            tokenType,
        });
        await tabs.closeTab(tabId);
        // TODO show notification about successful authentication
    }

    async deauthenticate() {
        await storage.remove(this.accessTokenKey);
    }
}

const auth = new Auth();

export default auth;
