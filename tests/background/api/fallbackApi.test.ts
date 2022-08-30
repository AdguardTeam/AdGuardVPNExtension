import axios from 'axios';

import {
    FallbackApi,
    WHOAMI_URL,
    GOOGLE_DOH_URL,
    CLOUDFLARE_DOH_URL,
    DEFAULT_CACHE_EXPIRE_TIME_MS,
} from '../../../src/background/api/fallbackApi';

jest.mock('axios');
jest.mock('../../../src/lib/logger');

jest.useFakeTimers('modern');

describe('FallbackApi', () => {
    it('returns default api urls if requests to cloudflare and google fail', async () => {
        (axios.get as jest.MockedFunction<typeof axios.get>).mockRejectedValue({
            status: 400,
        });

        const DEFAULT_VPN_API_URL = 'vpn_api.com';
        const DEFAULT_AUTH_API_URL = 'auth_api.com';

        const fallbackApi = new FallbackApi(DEFAULT_VPN_API_URL, DEFAULT_AUTH_API_URL);
        await fallbackApi.init();

        const vpnApiUrl = await fallbackApi.getVpnApiUrl();
        const authApiUrl = await fallbackApi.getAuthApiUrl();

        expect(vpnApiUrl).toBe(DEFAULT_VPN_API_URL);
        expect(authApiUrl).toBe(DEFAULT_AUTH_API_URL);

        expect(axios.get).toBeCalledWith(`https://${WHOAMI_URL}`, expect.anything());
        expect(axios.get).toBeCalledWith(`https://${GOOGLE_DOH_URL}`, expect.anything());
        expect(axios.get).toBeCalledWith(`https://${CLOUDFLARE_DOH_URL}`, expect.anything());
    });

    it('refreshes api url from backend if timestamp is expired, ', async () => {
        const DEFAULT_VPN_API_URL = 'vpn_api.com';
        const DEFAULT_AUTH_API_URL = 'auth_api.com';

        let REMOTE_VPN_API_URL = 'remote_vpn_api.com';
        let REMOTE_AUTH_API_URL = 'remote_auth_api.com';

        // create fallback instance with default api urls
        const fallbackApi = new FallbackApi(DEFAULT_VPN_API_URL, DEFAULT_AUTH_API_URL);

        // mock network request functions
        jest.spyOn<FallbackApi, any>(fallbackApi, 'getBkpVpnApiUrl').mockResolvedValue(REMOTE_VPN_API_URL);
        jest.spyOn<FallbackApi, any>(fallbackApi, 'getBkpAuthApiUrl').mockResolvedValue(REMOTE_AUTH_API_URL);

        // init with network requests
        await fallbackApi.init();

        // read api urls from memory
        let vpnApiUrl = await fallbackApi.getVpnApiUrl();
        let authApiUrl = await fallbackApi.getAuthApiUrl();

        expect(vpnApiUrl).toBe(REMOTE_VPN_API_URL);
        expect(authApiUrl).toBe(REMOTE_AUTH_API_URL);

        jest.advanceTimersByTime(DEFAULT_CACHE_EXPIRE_TIME_MS / 2);

        vpnApiUrl = await fallbackApi.getVpnApiUrl();
        authApiUrl = await fallbackApi.getAuthApiUrl();

        expect(vpnApiUrl).toBe(REMOTE_VPN_API_URL);
        expect(authApiUrl).toBe(REMOTE_AUTH_API_URL);
        expect(fallbackApi.getBkpVpnApiUrl).toBeCalledTimes(1);
        expect(fallbackApi.getBkpAuthApiUrl).toBeCalledTimes(1);

        jest.advanceTimersByTime(DEFAULT_CACHE_EXPIRE_TIME_MS / 2 + 100);

        // change remote response
        REMOTE_VPN_API_URL = 'remote_vpn_api.io';
        REMOTE_AUTH_API_URL = 'remote_auth_api.io';

        // mock network requests with new values
        jest.spyOn(fallbackApi, 'getBkpVpnApiUrl').mockResolvedValue(REMOTE_VPN_API_URL);
        jest.spyOn(fallbackApi, 'getBkpAuthApiUrl').mockResolvedValue(REMOTE_AUTH_API_URL);

        vpnApiUrl = await fallbackApi.getVpnApiUrl();
        authApiUrl = await fallbackApi.getAuthApiUrl();

        expect(vpnApiUrl).toBe(REMOTE_VPN_API_URL);
        expect(authApiUrl).toBe(REMOTE_AUTH_API_URL);
        expect(fallbackApi.getBkpVpnApiUrl).toBeCalledTimes(2);
        expect(fallbackApi.getBkpAuthApiUrl).toBeCalledTimes(2);
    });

    it('uses default api urls if bkb url is "none"', async () => {
        const DEFAULT_VPN_API_URL = 'vpn_api.com';
        const DEFAULT_AUTH_API_URL = 'auth_api.com';

        const fallbackApi = new FallbackApi(DEFAULT_VPN_API_URL, DEFAULT_AUTH_API_URL);

        jest.spyOn<FallbackApi, any>(fallbackApi, 'getBkpUrlByGoogleDoh').mockResolvedValue('"none"');
        await fallbackApi.init();

        let vpnApiUrl = await fallbackApi.getVpnApiUrl();
        let authApiUrl = await fallbackApi.getAuthApiUrl();

        expect(vpnApiUrl).toBe(DEFAULT_VPN_API_URL);
        expect(authApiUrl).toBe(DEFAULT_AUTH_API_URL);

        jest.advanceTimersByTime(DEFAULT_CACHE_EXPIRE_TIME_MS + 1);

        vpnApiUrl = await fallbackApi.getVpnApiUrl();
        authApiUrl = await fallbackApi.getAuthApiUrl();

        expect(vpnApiUrl).toBe(DEFAULT_VPN_API_URL);
        expect(authApiUrl).toBe(DEFAULT_AUTH_API_URL);

        const NEW_RESPONSE_URL_API = 'bkp_url.example.com';
        jest.spyOn<FallbackApi, any>(fallbackApi, 'getBkpUrlByGoogleDoh').mockResolvedValue(`"${NEW_RESPONSE_URL_API}"`);

        // before expiration time, previous api urls should be used
        jest.advanceTimersByTime(DEFAULT_CACHE_EXPIRE_TIME_MS / 2);

        vpnApiUrl = await fallbackApi.getVpnApiUrl();
        authApiUrl = await fallbackApi.getAuthApiUrl();

        expect(vpnApiUrl).toBe(DEFAULT_VPN_API_URL);
        expect(authApiUrl).toBe(DEFAULT_AUTH_API_URL);

        // after expiration time, new api urls should be used
        jest.advanceTimersByTime(DEFAULT_CACHE_EXPIRE_TIME_MS / 2 + 1);

        vpnApiUrl = await fallbackApi.getVpnApiUrl();
        authApiUrl = await fallbackApi.getAuthApiUrl();

        expect(vpnApiUrl).toBe('bkp_url.example.com');
        expect(authApiUrl).toBe('bkp_url.example.com');
    });

    it('uses previous bkb urls if getting backup urls fails', async () => {
        const DEFAULT_VPN_API_URL = 'vpn_api.com';
        const DEFAULT_AUTH_API_URL = 'auth_api.com';

        const fallbackApi = new FallbackApi(DEFAULT_VPN_API_URL, DEFAULT_AUTH_API_URL);

        const successUrl = 'success.com';
        jest.spyOn<FallbackApi, any>(fallbackApi, 'getBkpUrlByGoogleDoh').mockResolvedValue(successUrl);

        await fallbackApi.init();

        let vpnApiUrl = await fallbackApi.getVpnApiUrl();
        let authApiUrl = await fallbackApi.getAuthApiUrl();

        expect(vpnApiUrl).toBe(successUrl);
        expect(authApiUrl).toBe(successUrl);

        jest.advanceTimersByTime(DEFAULT_CACHE_EXPIRE_TIME_MS + 1);
        jest.spyOn<FallbackApi, any>(fallbackApi, 'getBkpUrlByGoogleDoh').mockRejectedValue(new Error('any'));
        jest.spyOn<FallbackApi, any>(fallbackApi, 'getBkpUrlByCloudFlareDoh').mockRejectedValue(new Error('any'));
        jest.spyOn<FallbackApi, any>(fallbackApi, 'getBkpUrlByAliDnsDoh').mockRejectedValue(new Error('any'));

        vpnApiUrl = await fallbackApi.getVpnApiUrl();
        authApiUrl = await fallbackApi.getAuthApiUrl();

        expect(vpnApiUrl).toBe(successUrl);
        expect(authApiUrl).toBe(successUrl);

        const successUrl2 = 'success2.com';
        jest.spyOn<FallbackApi, any>(fallbackApi, 'getBkpUrlByGoogleDoh').mockResolvedValue(successUrl2);
        vpnApiUrl = await fallbackApi.getVpnApiUrl();
        authApiUrl = await fallbackApi.getAuthApiUrl();

        expect(vpnApiUrl).toBe(successUrl2);
        expect(authApiUrl).toBe(successUrl2);
    });

    it('returns cached api urls if requests to cloudflare and google fail', async () => {
        const DEFAULT_VPN_API_URL = 'vpn_api.com';
        const DEFAULT_AUTH_API_URL = 'auth_api.com';

        const REMOTE_VPN_API_URL = 'remote_vpn_api.com';
        const REMOTE_AUTH_API_URL = 'remote_auth_api.com';

        // create fallback instance with default api urls
        const fallbackApi = new FallbackApi(DEFAULT_VPN_API_URL, DEFAULT_AUTH_API_URL);

        // mock network request functions
        jest.spyOn(fallbackApi, 'getBkpVpnApiUrl').mockResolvedValue(REMOTE_VPN_API_URL);
        jest.spyOn(fallbackApi, 'getBkpAuthApiUrl').mockResolvedValue(REMOTE_AUTH_API_URL);

        // init with network requests
        await fallbackApi.init();

        // read api urls from memory
        let vpnApiUrl = await fallbackApi.getVpnApiUrl();
        let authApiUrl = await fallbackApi.getAuthApiUrl();

        expect(vpnApiUrl).toBe(REMOTE_VPN_API_URL);
        expect(authApiUrl).toBe(REMOTE_AUTH_API_URL);

        jest.advanceTimersByTime(DEFAULT_CACHE_EXPIRE_TIME_MS + 100);

        // mock network requests with null (request error)
        jest.spyOn(fallbackApi, 'getBkpVpnApiUrl').mockResolvedValue(null);
        jest.spyOn(fallbackApi, 'getBkpAuthApiUrl').mockResolvedValue(null);

        vpnApiUrl = await fallbackApi.getVpnApiUrl();
        authApiUrl = await fallbackApi.getAuthApiUrl();

        expect(vpnApiUrl).toBe(REMOTE_VPN_API_URL);
        expect(authApiUrl).toBe(REMOTE_AUTH_API_URL);
    });
});
