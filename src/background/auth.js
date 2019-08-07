import qs from 'qs';
import { authApi } from './api';
import storage from './storage';

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
        if (accessToken) {
            return true;
        }
    }

    // TODO [maximtop] when ready api for social auth fix it
    async authenticateSocial(queryString) {
        const data = qs.parse(queryString);
        console.log(data);
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
        // TODO [maximtop] close auth redirect page
    }
}

const auth = new Auth();

export default auth;
