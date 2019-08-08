import qs from 'qs';
import Api from './Api';

// curl -X POST https://testauth.adguard.com/oauth/token -H 'Authorization: Basic YWRndWFyZC12cG4tZXh0ZW5zaW9uOg==' -d 'grant_type=password' -d 'scope=trust' -d 'username=...'  -d 'password=...'

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
            headers: { Authorization: 'Basic YWRndWFyZC12cG4tZXh0ZW5zaW9uOg==' },
        };

        return this.makeRequest(path, method, config);
    }
}

const AUTH_BASE_URL = 'https://testauth.adguard.com/oauth';

const proxyApi = new AuthApi(AUTH_BASE_URL);

export default proxyApi;
