import Credentials from '../../../src/background/credentials/Credentials';
import { vpnProvider } from '../../../src/background/providers/vpnProvider';
import { vpnApi } from '../../../src/background/api';
import notifier from '../../../src/lib/notifier';
import {
    UPDATE_CREDENTIALS_INTERVAL_MS,
    UPDATE_VPN_INFO_INTERVAL_MS,
} from '../../../src/lib/constants';

const browserApi = {
    storage: {
        set: jest.fn(),
        get: jest.fn(),
        remove: jest.fn(),
    },
};

const CREDENTIALS_DATA = {
    license_status: 'VALID',
    time_expires_sec: 9999561439,
    result: {
        credentials: '8wHFnx4R3dqMxG5C',
        expires_in_sec: 86399999,
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

const VPN_TOKEN_DATA = {
    token: 'test_token',
    licenseStatus: 'VALID',
    timeExpiresSec: 23223224,
    licenseKey: 'test_key',
    subscription: false,
    vpnSubscription: {
        next_bill_date_iso: '2011-10-05T14:48:00.000Z',
    },
};

// @ts-ignore
const credentials = new Credentials({ browserApi, vpnProvider });

jest.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue(VPN_TOKEN_DATA);
jest.spyOn(credentials, 'getAppId').mockResolvedValue('test_app_id');
jest.spyOn(credentials, 'trackInstallation').mockResolvedValue();
jest.spyOn(credentials, 'fetchUsername').mockResolvedValue('test@example.com');
jest.spyOn(credentials, 'updateProxyCredentials').mockResolvedValue();
jest.spyOn(vpnApi, 'getVpnCredentials').mockResolvedValue(CREDENTIALS_DATA);
jest.spyOn(vpnApi, 'getVpnExtensionInfo').mockResolvedValue(VPN_INFO_DATA);

jest.useFakeTimers();

describe('Api usage tests', () => {
    beforeAll(async () => {
        await credentials.init();
    });

    it('v1/proxy_credentials api have to be called once on credentials initialization', () => {
        expect(vpnApi.getVpnCredentials).toBeCalledTimes(1);

        notifier.notifyListeners(notifier.types.USER_AUTHENTICATED);
        jest.advanceTimersByTime(UPDATE_CREDENTIALS_INTERVAL_MS + 100);
    });

    it('v1/proxy_credentials api have to be called every 12 hours', () => {
        expect(vpnApi.getVpnCredentials).toBeCalledTimes(2);

        jest.advanceTimersByTime(UPDATE_VPN_INFO_INTERVAL_MS + 100);
    });

    it('v1/info/extension api have to be called every hour', () => {
        expect(vpnApi.getVpnExtensionInfo).toBeCalledTimes(25);
    });
});
