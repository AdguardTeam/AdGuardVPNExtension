import { authProvider } from '../../../src/background/providers/authProvider';
import { session } from '../../__mocks__';
// TODO: test mv3 after official switch to mv3
import { sessionState } from '../../../src/background/stateStorage/mv2';

jest.mock('../../../src/background/sessionStorage', () => {
    // eslint-disable-next-line global-require
    return require('../../../src/background/stateStorage/mv2');
});

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
    // eslint-disable-next-line global-require
    return require('../../__mocks__/browserApiMock');
});

global.chrome = {
    storage: {
        // @ts-ignore - partly implementation
        session,
    },
};

describe('authProvider', () => {
    beforeEach(async () => {
        await sessionState.init();
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
        // @ts-ignore - mock fetch manually
        global.fetch = jest.fn(() => Promise.resolve({
            json: () => Promise.resolve({
                status: 200,
                access_token: sampleToken.accessToken,
                expires_in: sampleToken.expiresIn,
                scope: sampleToken.scope,
                token_type: sampleToken.tokenType,
            }),
        }));

        const response = await authProvider.getAccessToken(emptyCredentials);

        expect(response).toEqual(sampleToken);
    });

    it('handles network errors', async () => {
        global.fetch = jest.fn(() => Promise.reject(new Error('Network Error')));

        const expectedError = new Error(JSON.stringify({ error: 'authentication_error_default' }));

        await expect(authProvider.getAccessToken(emptyCredentials)).rejects.toThrow(expectedError);
    });

    it('handles errors sent from server', async () => {
        // @ts-ignore - mock fetch manually
        global.fetch = jest.fn(() => Promise.resolve({
            // eslint-disable-next-line prefer-promise-reject-errors
            json: () => Promise.reject({
                status: 401,
                response: {
                    data: {
                        error: 'unauthorized',
                        error_code: 'bad_credentials',
                        error_description: 'Sorry, unrecognized username or password',
                    },
                },
            }),
        }));

        const expectedError = new Error(JSON.stringify({ error: 'authentication_error_wrong_credentials' }));

        await expect(authProvider.getAccessToken(emptyCredentials)).rejects.toThrow(expectedError);
    });
});
