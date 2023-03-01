import { browserApi } from '../browserApi';
import { AUTH_ACCESS_TOKEN_KEY } from '../config';
import type { AuthAccessToken } from '../api/apiTypes';

const getAccessTokenData = async (): Promise <AuthAccessToken> => {
    return browserApi.storage.get(AUTH_ACCESS_TOKEN_KEY);
};

const saveAccessTokenData = async (accessToken: AuthAccessToken): Promise <void> => {
    await browserApi.storage.set(AUTH_ACCESS_TOKEN_KEY, accessToken);
};

const removeAccessTokenData = async (): Promise <void> => {
    await browserApi.storage.remove(AUTH_ACCESS_TOKEN_KEY);
};

const isAuthenticated = async (): Promise<boolean> => {
    const accessTokenData = await getAccessTokenData();
    return !!accessTokenData?.accessToken;
};

export const authService = {
    getAccessTokenData,
    saveAccessTokenData,
    removeAccessTokenData,
    isAuthenticated,
};
