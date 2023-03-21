import { AuthService } from '../../../src/background/authentication/authService';
import type { AuthAccessToken } from '../../../src/background/schema';

const storageImplementation: { [key: string]: unknown } = {};

const browserApiImplementation = {
    storage: {
        set: (key: string, data: unknown) => {
            storageImplementation[key] = data;
        },
        get: (key: string) => {
            return storageImplementation[key];
        },
        remove: (key: string) => {
            delete storageImplementation[key];
        },
    },
};

const authenticatedUserData: AuthAccessToken = {
    accessToken: '1234509876',
    expiresIn: 123457890,
    tokenType: 'bearer',
};

const notAuthenticatedUserData: AuthAccessToken = {
    accessToken: '',
    expiresIn: 123457890,
    tokenType: 'bearer',
};

// @ts-ignore
const authService = new AuthService(browserApiImplementation);

jest.spyOn(authService.browserApi.storage, 'set');
jest.spyOn(authService.browserApi.storage, 'get');

describe('Auth Service', () => {
    afterEach(async () => {
        await authService.removeAccessTokenData();
    });

    it('Test accessTokenData caching', async () => {
        let accessTokenData = await authService.getAccessTokenData();
        expect(accessTokenData).toBeNull();
        expect(authService.browserApi.storage.get).toBeCalledTimes(1);

        accessTokenData = await authService.getAccessTokenData();
        expect(accessTokenData).toBeNull();
        // storage.get was called one more time because there was no cached value
        expect(authService.browserApi.storage.get).toBeCalledTimes(2);

        await authService.saveAccessTokenData(authenticatedUserData);
        expect(authService.browserApi.storage.set).toBeCalledTimes(1);

        accessTokenData = await authService.getAccessTokenData();
        expect(accessTokenData).toBeDefined();
        expect(accessTokenData).toBe(authenticatedUserData);
        // storage.get wasn't called one more time because the cached value was returned
        expect(authService.browserApi.storage.get).toBeCalledTimes(2);
    });

    it('Check user is authenticated', async () => {
        await authService.saveAccessTokenData(authenticatedUserData);
        let isAuthenticated = await authService.isAuthenticated();
        expect(isAuthenticated).toBeTruthy();

        await authService.saveAccessTokenData(notAuthenticatedUserData);
        isAuthenticated = await authService.isAuthenticated();
        expect(isAuthenticated).toBeFalsy();
    });
});
