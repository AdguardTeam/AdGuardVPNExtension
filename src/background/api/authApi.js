import qs from 'qs';
import Api from './Api';

class AuthApi extends Api {
    // API ENDPOINTS
    GET_TOKEN = { path: 'oauth/token', method: 'POST' };

    REGISTER_USER = { path: 'api/1.0/registration', method: 'POST' };

    getAccessToken(credentials) {
        const { username, password, twoFA } = credentials;
        const { path, method } = this.GET_TOKEN;

        const data = {
            username,
            password,
            scope: 'trust',
            grant_type: 'password_2fa',
            client_id: 'adguard-vpn-extension',
        };

        if (twoFA) {
            data['2fa_token'] = twoFA;
        }

        const config = {
            data: qs.stringify(data),
        };

        return this.makeRequest(path, method, config);
    }

    register(credentials) {
        const {
            username,
            password,
            marketingConsent,
            locale,
        } = credentials;

        const { path, method } = this.REGISTER_USER;

        const data = {
            email: username,
            password,
            marketingConsent,
            locale,
            source: 'EXTENSION',
        };

        const config = {
            data: qs.stringify(data),
        };

        return this.makeRequest(path, method, config);
    }
}

const AUTH_BASE_URL = 'https://testauth.adguard.com';

const vpnApi = new AuthApi(AUTH_BASE_URL);

export default vpnApi;
