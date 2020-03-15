import qs from 'qs';
import Api from './Api';
import { AUTH_API_URL, AUTH_CLIENT_ID } from '../config';

// Documentation
// https://bit.adguard.com/projects/ADGUARD/repos/adguard-auth-service/browse/oauth.md
class AuthApi extends Api {
    // API ENDPOINTS
    GET_TOKEN = { path: 'oauth/token', method: 'POST' };

    getAccessToken(credentials) {
        const { username, password, twoFactor } = credentials;
        const { path, method } = this.GET_TOKEN;

        const data = {
            username,
            password,
            scope: 'trust',
            grant_type: 'password_2fa',
            client_id: AUTH_CLIENT_ID,
        };

        if (twoFactor) {
            data['2fa_token'] = twoFactor;
        }

        const config = {
            data: qs.stringify(data),
        };

        return this.makeRequest(path, method, config);
    }

    REGISTER_USER = { path: 'api/1.0/registration', method: 'POST' };

    register(credentials) {
        const {
            username,
            password,
            marketingConsent,
            locale,
            clientId,
        } = credentials;

        const { path, method } = this.REGISTER_USER;

        const data = {
            email: username,
            password,
            marketingConsent,
            locale,
            clientId,
            source: 'EXTENSION',
        };

        const config = {
            data: qs.stringify(data),
        };

        return this.makeRequest(path, method, config);
    }

    REVOKE_TOKEN = { path: 'oauth/revoke_token', method: 'POST' };

    revokeToken(accessToken) {
        const { path, method } = this.REVOKE_TOKEN;
        const config = {
            data: qs.stringify({
                token: accessToken,
            }),
        };
        return this.makeRequest(path, method, config);
    }

    USER_LOOKUP = { path: 'api/1.0/user_lookup', method: 'POST' };

    userLookup(email, appId) {
        const { path, method } = this.USER_LOOKUP;
        const config = {
            data: qs.stringify({
                email,
                request_id: appId,
            }),
        };
        return this.makeRequest(path, method, config);
    }
}

const vpnApi = new AuthApi(AUTH_API_URL);

export default vpnApi;
