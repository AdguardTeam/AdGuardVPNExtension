import qs from 'qs';
import Api from './Api';

class AuthApi extends Api {
    GET_TOKEN = { path: 'token', method: 'POST' };

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
}

const AUTH_BASE_URL = 'https://testauth.adguard.com/oauth';

const proxyApi = new AuthApi(AUTH_BASE_URL);

export default proxyApi;
