import { Api } from './Api';
import { AUTH_CLIENT_ID } from '../config';
import { fallbackApi } from './fallbackApi';
import { AuthCredentials, RequestProps } from './apiTypes';

// Documentation
// projects/ADGUARD/repos/adguard-auth-service/browse/oauth.md
class AuthApi extends Api {
    // API ENDPOINTS
    GET_TOKEN: RequestProps = { path: 'oauth/token', method: 'POST' };

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

        const params: Data = {
            username,
            password,
            scope: 'trust',
            grant_type: 'password_2fa',
            client_id: AUTH_CLIENT_ID,
        };

        if (twoFactor) {
            params['2fa_token'] = twoFactor;
        }

        return this.makeRequest(path, { params }, method);
    }

    REGISTER_USER: RequestProps = { path: 'api/2.0/registration', method: 'POST' };

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

        const params = {
            email: username,
            password,
            marketingConsent: (!!marketingConsent).toString(),
            locale,
            clientId,
            applicationId: appId,
            source: 'VPN_APPLICATION',
        };

        return this.makeRequest(path, { params }, method);
    }

    USER_LOOKUP: RequestProps = { path: 'api/1.0/user_lookup', method: 'POST' };

    userLookup(email: string, appId: string) {
        const { path, method } = this.USER_LOOKUP;
        const params = {
            email,
            request_id: appId,
        };
        return this.makeRequest(path, { params }, method);
    }
}

export const authApi = new AuthApi(async () => {
    const authApiUrl = await fallbackApi.getAuthApiUrl();
    return authApiUrl;
});
