import axios from 'axios';

import {
    FallbackApi,
    GOOGLE_DOH_URL,
    DOHPUB_DOH_URL,
    QUAD9_DOH_URL,
} from '../../../src/background/api/fallbackApi';
import { stateStorage } from '../../../src/background/stateStorage';

jest.mock('../../../src/background/config', () => ({ FORWARDER_URL_QUERIES: {} }));

jest.mock('axios');
jest.mock('../../../src/common/logger');

jest.mock('../../../src/background/browserApi', () => {
    // eslint-disable-next-line global-require
    return require('../../__mocks__/browserApiMock');
});

jest.useFakeTimers('modern');

describe('FallbackApi', () => {
    beforeEach(async () => {
        await stateStorage.init();
    });

    afterEach(() => {
        jest.clearAllMocks();
        // @ts-expect-error - reset stateStorage to default
        stateStorage.state.fallbackInfo = null;
    });

    it('returns default api urls if requests to google, ali, quad9 fail', async () => {
        (axios.post as jest.MockedFunction<typeof axios.get>).mockRejectedValue({
            status: 400,
        });

        const DEFAULT_VPN_API_URL = 'vpn_api.com';
        const DEFAULT_AUTH_API_URL = 'auth_api.com';
        const DEFAULT_FORWARDER_API_URL = 'forwarder_api.com';

        const fallbackApi = new FallbackApi(DEFAULT_VPN_API_URL, DEFAULT_AUTH_API_URL, DEFAULT_FORWARDER_API_URL);
        await fallbackApi.init();

        const vpnApiUrl = await fallbackApi.getVpnApiUrl();
        const authApiUrl = await fallbackApi.getAuthApiUrl();
        const forwarderApiUrl = await fallbackApi.getForwarderApiUrl();

        expect(vpnApiUrl).toBe(DEFAULT_VPN_API_URL);
        expect(authApiUrl).toBe(DEFAULT_AUTH_API_URL);
        expect(forwarderApiUrl).toBe(DEFAULT_FORWARDER_API_URL);

        expect(axios.post).toBeCalledWith(`https://${GOOGLE_DOH_URL}`, expect.anything(), expect.anything());
        expect(axios.post).toBeCalledWith(`https://${DOHPUB_DOH_URL}`, expect.anything(), expect.anything());
        expect(axios.post).toBeCalledWith(`https://${QUAD9_DOH_URL}`, expect.anything(), expect.anything());
    });

    it('refreshes api url from backend if timestamp is expired, ', async () => {
        const DEFAULT_VPN_API_URL = 'vpn_api.com';
        const DEFAULT_AUTH_API_URL = 'auth_api.com';
        const DEFAULT_FORWARDER_API_URL = 'forwarder_api.com';

        let REMOTE_VPN_API_URL = 'remote_vpn_api.com';
        let REMOTE_AUTH_API_URL = 'remote_auth_api.com';

        // create fallback instance with default api urls
        const fallbackApi = new FallbackApi(DEFAULT_VPN_API_URL, DEFAULT_AUTH_API_URL, DEFAULT_FORWARDER_API_URL);

        // mock network request functions
        const getBkpVpnApiUrlMock = jest.spyOn(fallbackApi, 'getBkpVpnApiUrl');
        getBkpVpnApiUrlMock.mockResolvedValue(REMOTE_VPN_API_URL);
        const getBkpAuthApiUrlMock = jest.spyOn(fallbackApi, 'getBkpAuthApiUrl');
        getBkpAuthApiUrlMock.mockResolvedValue(REMOTE_AUTH_API_URL);

        // init with network requests
        await fallbackApi.init();

        // read api urls from memory
        let vpnApiUrl = await fallbackApi.getVpnApiUrl();
        let authApiUrl = await fallbackApi.getAuthApiUrl();
        let forwarderApiUrl = await fallbackApi.getForwarderApiUrl();

        expect(vpnApiUrl).toBe(REMOTE_VPN_API_URL);
        expect(authApiUrl).toBe(REMOTE_AUTH_API_URL);
        // vpn api url should be set as forwarder url
        expect(forwarderApiUrl).toBe(REMOTE_VPN_API_URL);

        jest.advanceTimersByTime(FallbackApi.DEFAULT_CACHE_EXPIRE_TIME_MS / 2);

        vpnApiUrl = await fallbackApi.getVpnApiUrl();
        authApiUrl = await fallbackApi.getAuthApiUrl();
        forwarderApiUrl = await fallbackApi.getForwarderApiUrl();

        expect(vpnApiUrl).toBe(REMOTE_VPN_API_URL);
        expect(authApiUrl).toBe(REMOTE_AUTH_API_URL);
        expect(forwarderApiUrl).toBe(REMOTE_VPN_API_URL);
        expect(fallbackApi.getBkpVpnApiUrl).toBeCalledTimes(1);
        expect(fallbackApi.getBkpAuthApiUrl).toBeCalledTimes(1);

        jest.advanceTimersByTime(FallbackApi.DEFAULT_CACHE_EXPIRE_TIME_MS / 2 + 100);

        // change remote response
        REMOTE_VPN_API_URL = 'remote_vpn_api.io';
        REMOTE_AUTH_API_URL = 'remote_auth_api.io';

        // mock network requests with new values
        getBkpVpnApiUrlMock.mockResolvedValue(REMOTE_VPN_API_URL);
        getBkpAuthApiUrlMock.mockResolvedValue(REMOTE_AUTH_API_URL);

        vpnApiUrl = await fallbackApi.getVpnApiUrl();
        authApiUrl = await fallbackApi.getAuthApiUrl();
        forwarderApiUrl = await fallbackApi.getForwarderApiUrl();

        expect(vpnApiUrl).toBe(REMOTE_VPN_API_URL);
        expect(authApiUrl).toBe(REMOTE_AUTH_API_URL);
        expect(forwarderApiUrl).toBe(REMOTE_VPN_API_URL);
        expect(fallbackApi.getBkpVpnApiUrl).toBeCalledTimes(2);
        expect(fallbackApi.getBkpAuthApiUrl).toBeCalledTimes(2);
    });

    it('uses default api urls if bkb url is "none"', async () => {
        const DEFAULT_VPN_API_URL = 'vpn_api.com';
        const DEFAULT_AUTH_API_URL = 'auth_api.com';
        const DEFAULT_FORWARDER_API_URL = 'forwarder_api.com';

        const fallbackApi = new FallbackApi(DEFAULT_VPN_API_URL, DEFAULT_AUTH_API_URL, DEFAULT_FORWARDER_API_URL);

        jest.spyOn<FallbackApi, any>(fallbackApi, 'getBkpUrlByGoogleDoh').mockResolvedValue('"none"');
        await fallbackApi.init();

        let vpnApiUrl = await fallbackApi.getVpnApiUrl();
        let authApiUrl = await fallbackApi.getAuthApiUrl();
        let forwarderApiUrl = await fallbackApi.getForwarderApiUrl();

        expect(vpnApiUrl).toBe(DEFAULT_VPN_API_URL);
        expect(authApiUrl).toBe(DEFAULT_AUTH_API_URL);
        expect(forwarderApiUrl).toBe(DEFAULT_FORWARDER_API_URL);

        jest.advanceTimersByTime(FallbackApi.DEFAULT_CACHE_EXPIRE_TIME_MS + 1);

        vpnApiUrl = await fallbackApi.getVpnApiUrl();
        authApiUrl = await fallbackApi.getAuthApiUrl();
        forwarderApiUrl = await fallbackApi.getForwarderApiUrl();

        expect(vpnApiUrl).toBe(DEFAULT_VPN_API_URL);
        expect(authApiUrl).toBe(DEFAULT_AUTH_API_URL);
        expect(forwarderApiUrl).toBe(DEFAULT_FORWARDER_API_URL);

        const NEW_RESPONSE_URL_API = 'bkp_url.example.com';
        jest.spyOn<FallbackApi, any>(fallbackApi, 'getBkpUrlByGoogleDoh').mockResolvedValue(`"${NEW_RESPONSE_URL_API}"`);

        // before expiration time, previous api urls should be used
        jest.advanceTimersByTime(FallbackApi.DEFAULT_CACHE_EXPIRE_TIME_MS / 2);

        vpnApiUrl = await fallbackApi.getVpnApiUrl();
        authApiUrl = await fallbackApi.getAuthApiUrl();
        forwarderApiUrl = await fallbackApi.getForwarderApiUrl();

        expect(vpnApiUrl).toBe(DEFAULT_VPN_API_URL);
        expect(authApiUrl).toBe(DEFAULT_AUTH_API_URL);
        expect(forwarderApiUrl).toBe(DEFAULT_FORWARDER_API_URL);

        // after expiration time, new api urls should be used
        jest.advanceTimersByTime(FallbackApi.DEFAULT_CACHE_EXPIRE_TIME_MS / 2 + 1);

        vpnApiUrl = await fallbackApi.getVpnApiUrl();
        authApiUrl = await fallbackApi.getAuthApiUrl();
        forwarderApiUrl = await fallbackApi.getForwarderApiUrl();

        expect(vpnApiUrl).toBe('bkp_url.example.com');
        expect(authApiUrl).toBe('bkp_url.example.com');
        expect(forwarderApiUrl).toBe('bkp_url.example.com');
    });

    it('uses previous bkb urls if getting backup urls fails', async () => {
        const DEFAULT_VPN_API_URL = 'vpn_api.com';
        const DEFAULT_AUTH_API_URL = 'auth_api.com';
        const DEFAULT_FORWARDER_API_URL = 'forwarder_api.com';

        const fallbackApi = new FallbackApi(DEFAULT_VPN_API_URL, DEFAULT_AUTH_API_URL, DEFAULT_FORWARDER_API_URL);

        const successUrl = 'success.com';
        jest.spyOn<FallbackApi, any>(fallbackApi, 'getBkpUrlByGoogleDoh').mockResolvedValue(successUrl);

        await fallbackApi.init();

        let vpnApiUrl = await fallbackApi.getVpnApiUrl();
        let authApiUrl = await fallbackApi.getAuthApiUrl();
        let forwarderApiUrl = await fallbackApi.getForwarderApiUrl();

        expect(vpnApiUrl).toBe(successUrl);
        expect(authApiUrl).toBe(successUrl);
        expect(forwarderApiUrl).toBe(successUrl);

        jest.advanceTimersByTime(FallbackApi.DEFAULT_CACHE_EXPIRE_TIME_MS + 1);
        jest.spyOn<FallbackApi, any>(fallbackApi, 'getBkpUrlByGoogleDoh').mockRejectedValue(new Error('any'));
        jest.spyOn<FallbackApi, any>(fallbackApi, 'getBkpUrlByDohPubDnsDoh').mockRejectedValue(new Error('any'));
        jest.spyOn<FallbackApi, any>(fallbackApi, 'getBkpUrlByQuad9Doh').mockRejectedValue(new Error('any'));

        vpnApiUrl = await fallbackApi.getVpnApiUrl();
        authApiUrl = await fallbackApi.getAuthApiUrl();
        forwarderApiUrl = await fallbackApi.getForwarderApiUrl();

        expect(vpnApiUrl).toBe(successUrl);
        expect(authApiUrl).toBe(successUrl);
        expect(forwarderApiUrl).toBe(successUrl);

        const successUrl2 = 'success2.com';
        jest.spyOn<FallbackApi, any>(fallbackApi, 'getBkpUrlByGoogleDoh').mockResolvedValue(successUrl2);
        vpnApiUrl = await fallbackApi.getVpnApiUrl();
        authApiUrl = await fallbackApi.getAuthApiUrl();
        forwarderApiUrl = await fallbackApi.getForwarderApiUrl();

        expect(vpnApiUrl).toBe(successUrl2);
        expect(authApiUrl).toBe(successUrl2);
        expect(forwarderApiUrl).toBe(successUrl2);
    });

    it('returns cached api urls if requests to google, ali, quad9 fail', async () => {
        const DEFAULT_VPN_API_URL = 'vpn_api.com';
        const DEFAULT_AUTH_API_URL = 'auth_api.com';
        const DEFAULT_FORWARDER_API_URL = 'forwarder_api.com';

        const REMOTE_VPN_API_URL = 'remote_vpn_api.com';
        const REMOTE_AUTH_API_URL = 'remote_auth_api.com';

        // create fallback instance with default api urls
        const fallbackApi = new FallbackApi(DEFAULT_VPN_API_URL, DEFAULT_AUTH_API_URL, DEFAULT_FORWARDER_API_URL);

        // mock network request functions
        jest.spyOn(fallbackApi, 'getBkpVpnApiUrl').mockResolvedValue(REMOTE_VPN_API_URL);
        jest.spyOn(fallbackApi, 'getBkpAuthApiUrl').mockResolvedValue(REMOTE_AUTH_API_URL);

        // init with network requests
        await fallbackApi.init();

        // read api urls from memory
        let vpnApiUrl = await fallbackApi.getVpnApiUrl();
        let authApiUrl = await fallbackApi.getAuthApiUrl();
        let forwarderApiUrl = await fallbackApi.getForwarderApiUrl();

        expect(vpnApiUrl).toBe(REMOTE_VPN_API_URL);
        expect(authApiUrl).toBe(REMOTE_AUTH_API_URL);
        expect(forwarderApiUrl).toBe(REMOTE_VPN_API_URL);

        jest.advanceTimersByTime(FallbackApi.DEFAULT_CACHE_EXPIRE_TIME_MS + 100);

        // mock network requests with null (request error)
        jest.spyOn(fallbackApi, 'getBkpVpnApiUrl').mockResolvedValue(null);
        jest.spyOn(fallbackApi, 'getBkpAuthApiUrl').mockResolvedValue(null);

        vpnApiUrl = await fallbackApi.getVpnApiUrl();
        authApiUrl = await fallbackApi.getAuthApiUrl();
        forwarderApiUrl = await fallbackApi.getForwarderApiUrl();

        expect(vpnApiUrl).toBe(REMOTE_VPN_API_URL);
        expect(authApiUrl).toBe(REMOTE_AUTH_API_URL);
        expect(forwarderApiUrl).toBe(REMOTE_VPN_API_URL);
    });

    it('update bkp urls on dns requests success after they failed and default values were set', async () => {
        const DEFAULT_VPN_API_URL = 'vpn_api.com';
        const DEFAULT_AUTH_API_URL = 'auth_api.com';
        const DEFAULT_FORWARDER_API_URL = 'forwarder_api.com';

        const fallbackApi = new FallbackApi(DEFAULT_VPN_API_URL, DEFAULT_AUTH_API_URL, DEFAULT_FORWARDER_API_URL);

        // mock dns request fail
        jest.spyOn<FallbackApi, any>(fallbackApi, 'getBkpUrlByGoogleDoh').mockRejectedValue(new Error('any'));

        await fallbackApi.init();

        let vpnApiUrl = await fallbackApi.getVpnApiUrl();
        let authApiUrl = await fallbackApi.getAuthApiUrl();
        let forwarderApiUrl = await fallbackApi.getForwarderApiUrl();

        // default values should be set
        expect(vpnApiUrl).toBe(DEFAULT_VPN_API_URL);
        expect(authApiUrl).toBe(DEFAULT_AUTH_API_URL);
        expect(forwarderApiUrl).toBe(DEFAULT_FORWARDER_API_URL);

        const REMOTE_URL = 'remote_url.com';

        // mock dns request success
        jest.spyOn<FallbackApi, any>(fallbackApi, 'getBkpUrlByGoogleDoh').mockResolvedValue(REMOTE_URL);

        vpnApiUrl = await fallbackApi.getVpnApiUrl();
        authApiUrl = await fallbackApi.getAuthApiUrl();
        forwarderApiUrl = await fallbackApi.getForwarderApiUrl();

        // fetched values should be set
        expect(vpnApiUrl).toBe(REMOTE_URL);
        expect(authApiUrl).toBe(REMOTE_URL);
        expect(forwarderApiUrl).toBe(REMOTE_URL);
    });
});
