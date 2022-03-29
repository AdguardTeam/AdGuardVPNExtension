import Credentials from '../../../src/background/credentials/Credentials';
import { vpnProvider } from '../../../src/background/providers/vpnProvider';
import { vpnApi } from '../../../src/background/api';
import notifier from '../../../src/lib/notifier';

const UPDATE_CREDENTIALS_INTERVAL_MS = 1000 * 60 * 60 * 24;

const UPDATE_VPN_INFO_INTERVAL_MS = 1000 * 60 * 60;

const browserApi = {};

const CREDENTIALS_DATA = {
    license_status: 'TEST',
    time_expires_sec: 10000,
    result: {
        credentials: 'test',
        expires_in_sec: 10000,
    },
    data: {},
    status: 200,
    statusText: '',
    headers: '',
    config: {},
};

const VPN_INFO_DATA = {
    bandwidth_free_mbits: 100,
    premium_promo_page: 'https://adguard.com/test',
    premium_promo_enabled: true,
    refresh_tokens: false,
    vpn_failure_page: 'https://adguard.com/test',
    used_downloaded_bytes: 100,
    used_uploaded_bytes: 100,
    max_downloaded_bytes: 100,
    max_uploaded_bytes: 100,
    renewal_traffic_date: '33948783743',
    connected_devices_count: 1,
    max_devices_count: 5,
    vpn_connected: false,
    data: {},
    status: 200,
    statusText: '',
    headers: '',
    config: {},
};

// @ts-ignore
const credentials = new Credentials({ browserApi, vpnProvider });

jest.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue({ token: 'test_token' });
jest.spyOn(credentials, 'getAppId').mockResolvedValue('test_app_id');
jest.spyOn(credentials, 'trackInstallation').mockResolvedValue();
jest.spyOn(vpnApi, 'getVpnCredentials').mockResolvedValue(CREDENTIALS_DATA);
jest.spyOn(vpnApi, 'getVpnExtensionInfo').mockResolvedValue(VPN_INFO_DATA);

jest.useFakeTimers('modern');

describe('Api usage tests', () => {
    afterAll(() => {
        jest.clearAllMocks();
    });

    it('v1/proxy_credentials api have to be called once on credentials initialization', async () => {
        await credentials.init();
        expect(vpnApi.getVpnCredentials).toBeCalledTimes(1);
    });

    it('v1/proxy_credentials api have to be called every 12 hours', async () => {
        await credentials.init();
        notifier.notifyListeners(notifier.types.USER_AUTHENTICATED);
        jest.runTimersToTime(UPDATE_CREDENTIALS_INTERVAL_MS / 2 + 100);
        expect(vpnApi.getVpnCredentials).toBeCalledTimes(2);
    });

    it('v1/info/extension api have to be called every hour', async () => {
        await credentials.init();
        notifier.notifyListeners(notifier.types.USER_AUTHENTICATED);
        jest.runTimersToTime(UPDATE_VPN_INFO_INTERVAL_MS + 100);
        expect(vpnApi.getVpnExtensionInfo).toBeCalledTimes(1);
    });
});
