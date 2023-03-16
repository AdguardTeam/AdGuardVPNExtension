import axios from 'axios';

import { authProvider } from '../../../src/background/providers/authProvider';
import { session } from '../../../src/background/sessionStorage';

jest.mock('axios');
jest.mock('../../../src/lib/logger');
jest.mock('../../../src/background/browserApi');

const emptyCredentials = {
    username: '',
    password: '',
    twoFactor: '',
    marketingConsent: false,
    locale: '',
    clientId: '',
    appId: '',
};

jest.mock('../../../src/background/browserApi', () => {
    const storage: { [key: string]: any } = {
        set: jest.fn(async (key: string, data: any): Promise<void> => {
            storage[key] = data;
        }),
        get: jest.fn(async (key: string): Promise<string> => {
            return storage[key];
        }),
        remove: jest.fn(async (key: string): Promise<boolean> => {
            return delete storage[key];
        }),
    };
    const runtime = {
        // TODO: test mv3 after official switch to mv3
        isManifestVersion2: () => true,
    };

    return {
        __esModule: true,
        browserApi: {
            storage,
            runtime,
        },
    };
});

describe('authProvider', () => {
    beforeEach(async () => {
        await session.init();
    });

    afterAll(() => {
        jest.clearAllMocks();
    });

    const sampleToken = {
        accessToken: '311b0564-0040',
        expiresIn: 2627815,
        scope: 'trust',
        tokenType: 'bearer',
    };

    it('makes requests to the server', async () => {
        // @ts-ignore
        axios.mockResolvedValue({
            status: 200,
            data: {
                access_token: sampleToken.accessToken,
                expires_in: sampleToken.expiresIn,
                scope: sampleToken.scope,
                token_type: sampleToken.tokenType,
            },
        });

        const response = await authProvider.getAccessToken(emptyCredentials);

        expect(response).toEqual(sampleToken);
    });

    it('handles network errors', async () => {
        // @ts-ignore
        axios.mockRejectedValue(new Error('Network Error'));

        const expectedError = new Error(JSON.stringify({ error: 'authentication_error_default' }));

        await expect(authProvider.getAccessToken(emptyCredentials)).rejects.toThrow(expectedError);
    });

    it('handles errors sent from server', async () => {
        // @ts-ignore
        axios.mockRejectedValue({
            status: 401,
            response: {
                data: {
                    error: 'unauthorized',
                    error_code: 'bad_credentials',
                    error_description: 'Sorry, unrecognized username or password',
                },
            },
        });

        const expectedError = new Error(JSON.stringify({ error: 'authentication_error_wrong_credentials' }));

        await expect(authProvider.getAccessToken(emptyCredentials)).rejects.toThrow(expectedError);
    });
});
