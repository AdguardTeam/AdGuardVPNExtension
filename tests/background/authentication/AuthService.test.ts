import {
    vi,
    describe,
    afterEach,
    it,
    expect,
} from 'vitest';

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

// @ts-ignore - partly implementation
const authService = new AuthService(browserApiImplementation);

// @ts-expect-error - accessing private property in test
vi.spyOn(authService.browserApi.storage, 'set');
// @ts-expect-error - accessing private property in test
vi.spyOn(authService.browserApi.storage, 'get');

describe('Auth Service', () => {
    afterEach(async () => {
        await authService.removeAccessTokenData();
    });

    it('Test accessTokenData caching', async () => {
        let accessTokenData = await authService.getAccessTokenData();
        expect(accessTokenData).toBeNull();
        // @ts-expect-error - accessing private property in test
        expect(authService.browserApi.storage.get).toBeCalledTimes(1);

        accessTokenData = await authService.getAccessTokenData();
        expect(accessTokenData).toBeNull();
        // storage.get was called one more time because there was no cached value
        // @ts-expect-error - accessing private property in test
        expect(authService.browserApi.storage.get).toBeCalledTimes(2);

        await authService.saveAccessTokenData(authenticatedUserData);
        // @ts-expect-error - accessing private property in test
        expect(authService.browserApi.storage.set).toBeCalledTimes(1);

        accessTokenData = await authService.getAccessTokenData();
        expect(accessTokenData).toBeDefined();
        expect(accessTokenData).toBe(authenticatedUserData);
        // storage.get wasn't called one more time because the cached value was returned
        // @ts-expect-error - accessing private property in test
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
