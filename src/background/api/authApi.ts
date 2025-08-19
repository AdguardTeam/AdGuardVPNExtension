import { Api } from './Api';
import { fallbackApi } from './fallbackApi';
import { type RequestProps } from './apiTypes';

// Documentation
// projects/ADGUARD/repos/adguard-auth-service/browse/oauth.md
class AuthApi extends Api {
    // API ENDPOINTS
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
