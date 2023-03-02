import { browserApi } from '../browserApi';
import { AUTH_ACCESS_TOKEN_KEY } from '../config';
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
class AuthService implements AuthServiceInterface {
    getAccessTokenData = async (): Promise <AuthAccessToken> => {
        return browserApi.storage.get(AUTH_ACCESS_TOKEN_KEY);
    };

    saveAccessTokenData = async (accessToken: AuthAccessToken): Promise <void> => {
        await browserApi.storage.set(AUTH_ACCESS_TOKEN_KEY, accessToken);
    };

    removeAccessTokenData = async (): Promise <void> => {
        await browserApi.storage.remove(AUTH_ACCESS_TOKEN_KEY);
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
