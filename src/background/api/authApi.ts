import qs from 'qs';
import { Method } from 'axios';

import { Api } from './Api';
import { AUTH_CLIENT_ID } from '../config';
import { fallbackApi } from './fallbackApi';
import { AuthCredentials } from './apiTypes';

type ApiEndpoint = {
    path: string;
    method: Method;
};

// Documentation
// projects/ADGUARD/repos/adguard-auth-service/browse/oauth.md
class AuthApi extends Api {
    // API ENDPOINTS
    GET_TOKEN: ApiEndpoint = { path: 'oauth/token', method: 'POST' };

    getAccessToken(credentials: AuthCredentials) {
        const { username, password, twoFactor } = credentials;
        const { path, method } = this.GET_TOKEN;

        type Data = {
            username: string;
            password: string;
            scope: string;
            grant_type: string;
            client_id: string;
            '2fa_token'?: string;
        };

        const data: Data = {
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

        return this.makeRequest(path, config, method);
    }

    REGISTER_USER: ApiEndpoint = { path: 'api/2.0/registration', method: 'POST' };

    register(credentials: AuthCredentials) {
        const {
            username,
            password,
            marketingConsent,
            locale,
            clientId,
            appId,
        } = credentials;

        const { path, method } = this.REGISTER_USER;

        const data = {
            email: username,
            password,
            marketingConsent: !!marketingConsent,
            locale,
            clientId,
            applicationId: appId,
            source: 'VPN_APPLICATION',
        };

        const config = {
            data: qs.stringify(data),
        };

        return this.makeRequest(path, config, method);
    }

    USER_LOOKUP: ApiEndpoint = { path: 'api/1.0/user_lookup', method: 'POST' };

    userLookup(email: string, appId: string) {
        const { path, method } = this.USER_LOOKUP;
        const config = {
            data: qs.stringify({
                email,
                request_id: appId,
            }),
        };
        return this.makeRequest(path, config, method);
    }
}

export const authApi = new AuthApi(async () => {
    const authApiUrl = await fallbackApi.getAuthApiUrl();
    return authApiUrl;
});
