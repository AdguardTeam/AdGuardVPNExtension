import { authProvider } from '../../../src/background/providers/authProvider';
import { stateStorage } from '../../../src/background/stateStorage';
import { fetchResolveMock, fetchRejectMock } from '../../__mocks__/fetchMock';

jest.mock('../../../src/background/config', () => ({ FORWARDER_URL_QUERIES: {} }));

jest.mock('../../../src/common/logger');
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

describe('authProvider', () => {
    beforeEach(async () => {
        await stateStorage.init();
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
        fetchResolveMock(Promise.resolve({
            status: 200,
            access_token: sampleToken.accessToken,
            expires_in: sampleToken.expiresIn,
            scope: sampleToken.scope,
            token_type: sampleToken.tokenType,
        }));

        const response = await authProvider.getAccessToken(emptyCredentials);

        expect(response).toEqual(sampleToken);
    });

    it('handles network errors', async () => {
        fetchRejectMock();

        const expectedError = new Error(JSON.stringify({ error: 'authentication_error_default' }));

        await expect(authProvider.getAccessToken(emptyCredentials)).rejects.toThrow(expectedError);
    });

    it('handles errors sent from server', async () => {
        fetchResolveMock({
            status: 401,
            error: 'unauthorized',
            error_code: 'bad_credentials',
            error_description: 'Sorry, unrecognized username or password',
        }, false);

        const expectedError = new Error(JSON.stringify({
            error: 'authentication_error_wrong_credentials',
            status: 'bad_credentials',
        }));

        await expect(authProvider.getAccessToken(emptyCredentials)).rejects.toThrow(expectedError);
    });
});
