import axios from 'axios';

import {
    FallbackApi,
    WHOAMI_URL,
    GOOGLE_DOH_URL,
    CLOUDFLARE_DOH_URL,
} from '../../../src/background/api/fallbackApi';

jest.mock('axios');
jest.mock('../../../src/lib/logger');

describe('FallbackApi', () => {
    it('if requests to cloudflare and google fail, returns default api urls', async () => {
        axios.get.mockRejectedValue({
            status: 400,
        });

        const DEFAULT_VPN_API_URL = 'vpn_api.com';
        const DEFAULT_AUTH_API_URL = 'auth_api.com';

        const fallbackApi = new FallbackApi(DEFAULT_VPN_API_URL, DEFAULT_AUTH_API_URL);
        await fallbackApi.init();

        expect(fallbackApi.getVpnApiUrl()).toBe(DEFAULT_VPN_API_URL);
        expect(fallbackApi.getAuthApiUrl()).toBe(DEFAULT_AUTH_API_URL);

        expect(axios.get).toBeCalledWith(`https://${WHOAMI_URL}`, expect.anything());
        expect(axios.get).toBeCalledWith(`https://${GOOGLE_DOH_URL}`, expect.anything());
        expect(axios.get).toBeCalledWith(`https://${CLOUDFLARE_DOH_URL}`, expect.anything());
    });
});
