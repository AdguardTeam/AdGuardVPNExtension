import { AuthService } from '../../../src/background/authentication/authService';
import type { AuthAccessToken } from '../../../src/background/api/apiTypes';

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

describe('Auth Service', () => {
    it('Check user is authenticated', async () => {
        await authService.saveAccessTokenData(authenticatedUserData);
        let isAuthenticated = await authService.isAuthenticated();
        expect(isAuthenticated).toBeTruthy();

        await authService.saveAccessTokenData(notAuthenticatedUserData);
        isAuthenticated = await authService.isAuthenticated();
        expect(isAuthenticated).toBeFalsy();
    });
});
