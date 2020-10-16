import axios from 'axios';
import translator from '../../../src/lib/translator/translator';
import authProvider from '../../../src/background/providers/authProvider';

jest.mock('axios');
jest.mock('../../../src/lib/logger');

describe('authProvider', () => {
    beforeAll(() => {
        translator.translate = jest.fn((key) => {
            return key;
        });
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
        axios.mockResolvedValue({
            status: 200,
            data: {
                access_token: sampleToken.accessToken,
                expires_in: sampleToken.expiresIn,
                scope: sampleToken.scope,
                token_type: sampleToken.tokenType,
            },
        });

        const response = await authProvider.getAccessToken({});

        expect(response).toEqual(sampleToken);
    });

    it('handles network errors', async () => {
        axios.mockRejectedValue(new Error('Network Error'));

        const expectedError = new Error(JSON.stringify({ error: 'authentication_error_default' }));

        await expect(authProvider.getAccessToken({})).rejects.toThrow(expectedError);
    });

    it('handles errors sent from server', async () => {
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

        await expect(authProvider.getAccessToken({})).rejects.toThrow(expectedError);
    });
});
