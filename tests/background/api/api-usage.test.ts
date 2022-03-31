import Credentials from '../../../src/background/credentials/Credentials';
import { vpnProvider } from '../../../src/background/providers/vpnProvider';
import { vpnApi } from '../../../src/background/api';
import notifier from '../../../src/lib/notifier';
import { UPDATE_CREDENTIALS_INTERVAL_MS } from '../../../src/lib/constants';

const EXPIRES_IN_SEC_START = 90000;
const EXPIRES_IN_SEC_AFTER_24H = 3600;

const browserApi = {
    storage: {
        set: jest.fn(),
        get: jest.fn(),
        remove: jest.fn(),
    },
};

const getCredentialsData = (expiresInSec: number) => {
    return {
        license_status: 'VALID',
        time_expires_sec: 9999561439,
        result: {
            credentials: '8wHFnx4R3dqMxG5C',
            expires_in_sec: expiresInSec,
        },
        data: {},
        status: 200,
        statusText: '',
        headers: '',
        config: {},
    };
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
jest.spyOn(vpnApi, 'getVpnExtensionInfo').mockResolvedValue(VPN_INFO_DATA);
// credentials will expire in 24 + 1 hour = 90000 sec
jest.spyOn(vpnApi, 'getVpnCredentials').mockResolvedValue(getCredentialsData(EXPIRES_IN_SEC_START));

jest.useFakeTimers();

describe('Api usage tests', () => {
    beforeAll(async () => {
        await credentials.init();
    });

    it('v1/proxy_credentials api have to be called once on credentials initialization', () => {
        expect(vpnApi.getVpnCredentials).toBeCalledTimes(1);
        expect(credentials.vpnCredentials?.result.expiresInSec).toBe(EXPIRES_IN_SEC_START);

        notifier.notifyListeners(notifier.types.USER_AUTHENTICATED);
        // advance timers for 24 hours + 100 ms
        jest.advanceTimersByTime(UPDATE_CREDENTIALS_INTERVAL_MS + 100);
        // credentials will expire in 1 hour
        jest.spyOn(vpnApi, 'getVpnCredentials').mockResolvedValue(getCredentialsData(EXPIRES_IN_SEC_AFTER_24H));
    });

    it('v1/proxy_credentials api have to be called every 24 hours', () => {
        // v1/proxy_credentials api have to be called second time after 24 hours passed
        expect(vpnApi.getVpnCredentials).toBeCalledTimes(2);
    });

    it('v1/info/extension api have to be called every hour', () => {
        // v1/info/extension api have to be called 24 times for the last 24 hours
        expect(vpnApi.getVpnExtensionInfo).toBeCalledTimes(24);

        // advance timers for half an hour + 100 ms
        jest.advanceTimersByTime(EXPIRES_IN_SEC_AFTER_24H * 1000 + 100);
    });

    it('v1/proxy_credentials api have to be called in half an hour before credentials expired', () => {
        // v1/proxy_credentials api have to be called third time
        expect(vpnApi.getVpnCredentials).toBeCalledTimes(3);
        expect(credentials.vpnCredentials?.result.expiresInSec).toBe(EXPIRES_IN_SEC_AFTER_24H);
    });
});
