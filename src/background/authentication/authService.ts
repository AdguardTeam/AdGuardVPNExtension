import { BrowserApi, browserApi } from '../browserApi';
import type { AuthAccessToken } from '../api/apiTypes';

interface AuthServiceInterface {
    getAccessTokenData(): Promise <AuthAccessToken>;
    saveAccessTokenData(accessToken: AuthAccessToken): Promise <void>;
    removeAccessTokenData(): Promise <void>;
    isAuthenticated(): Promise<boolean>;
}

/**
 * This service stores and manages auth token data in browser storage
 * and verifies whether a user is authenticated
 */
export class AuthService implements AuthServiceInterface {
    browserApi: BrowserApi;

    accessTokenData: AuthAccessToken | null;

    private AUTH_ACCESS_TOKEN_KEY = 'auth.access.token';

    constructor(providedBrowserApi?: BrowserApi) {
        this.browserApi = providedBrowserApi || browserApi;
    }

    getAccessTokenData = async (): Promise <AuthAccessToken> => {
        return this.accessTokenData
            || await this.browserApi.storage.get(this.AUTH_ACCESS_TOKEN_KEY);
    };

    saveAccessTokenData = async (accessToken: AuthAccessToken): Promise <void> => {
        this.accessTokenData = accessToken;
        await this.browserApi.storage.set(this.AUTH_ACCESS_TOKEN_KEY, accessToken);
    };

    removeAccessTokenData = async (): Promise <void> => {
        this.accessTokenData = null;
        await this.browserApi.storage.remove(this.AUTH_ACCESS_TOKEN_KEY);
    };

    /**
     * User is considered authenticated
     * if an accessToken is present in the access token data
     */
    isAuthenticated = async (): Promise<boolean> => {
        const accessTokenData = await this.getAccessTokenData();
        return !!accessTokenData?.accessToken;
    };
}

export const authService = new AuthService();
