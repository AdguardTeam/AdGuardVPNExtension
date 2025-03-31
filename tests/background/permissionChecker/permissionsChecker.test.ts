import { permissionsChecker } from '../../../src/background/permissionsChecker';
import { notifier } from '../../../src/common/notifier';
import { SubscriptionType } from '../../../src/common/constants';
import {
    UPDATE_CREDENTIALS_INTERVAL_MS,
    UPDATE_VPN_INFO_INTERVAL_MS,
} from '../../../src/background/permissionsChecker/PermissionsChecker';
import { session } from '../../__mocks__';
// TODO: test mv3 after official switch to mv3
import { stateStorage } from '../../../src/background/stateStorage/mv2';
import { credentials } from '../../../src/background/credentials';

jest.mock('../../../src/background/auth/auth.ts', () => ({
    auth: {
        isAuthenticated: () => Promise.resolve(true),
    },
}));

jest.mock('../../../src/background/stateStorage', () => {
    // eslint-disable-next-line global-require
    return require('../../../src/background/stateStorage/mv2');
});

jest.mock('../../../src/background/config', () => ({ FORWARDER_URL_QUERIES: {} }));

const TEST_PERIOD_SEC = 60 * 60 * 5; // 5 hours

const getCredentialsData = (expiresInSec: number) => {
    return {
        licenseStatus: 'VALID',
        timeExpiresSec: 9999561439,
        timeExpiresIso: new Date(Date.now()).toISOString(),
        result: {
            credentials: 'testtestetst',
            expiresInSec,
        },
        data: {},
        status: 200,
        statusText: '',
        headers: '',
        config: {},
    };
};

const VPN_TOKEN_DATA = {
    token: 'test_token',
    licenseStatus: 'VALID',
    timeExpiresSec: 23223224,
    timeExpiresIso: '1970-09-26T18:53:44+0000',
    licenseKey: 'test_key',
    subscription: false,
    vpnSubscription: {
        next_bill_date_iso: '2023-10-05T14:48:00.000Z',
        duration_v2: SubscriptionType.Monthly,
    },
};

jest.mock('../../../src/common/logger');
jest.mock('../../../src/background/settings');
jest.mock('../../../src/background/connectivity/connectivityService');

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

// testing timers for MV2
// TODO: change timers implementation on official switch to MV3 and find out how to move time for Alarm API
jest.mock('../../../src/background/timers', () => {
    return {
        timers: {
            setTimeout: (callback: () => void, timeout: number) => setTimeout(callback, timeout),
            clearTimeout: (timerId: number): void => clearTimeout(timerId),
            setInterval: (callback: () => void, interval: number) => setInterval(callback, interval),
            clearInterval: (intervalId: number): void => clearInterval(intervalId),
        },
    };
});

jest.spyOn(permissionsChecker, 'startChecker');
jest.spyOn(permissionsChecker, 'checkPermissions');
jest.spyOn(permissionsChecker, 'getVpnInfo');

jest.spyOn(permissionsChecker.credentials, 'gainValidVpnCredentials').mockResolvedValue(getCredentialsData(99999999));
jest.spyOn(permissionsChecker.credentials, 'gainValidVpnToken').mockResolvedValue(VPN_TOKEN_DATA);

jest.useFakeTimers();

describe('PermissionsChecker tests', () => {
    beforeEach(async () => {
        await stateStorage.init();
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.clearAllMocks();
    });

    it('Check permissions every 24 hours', () => {
        credentials.init();
        permissionsChecker.credentials.vpnCredentials = getCredentialsData(99999999);
        permissionsChecker.init();
        notifier.notifyListeners(notifier.types.USER_AUTHENTICATED);
        expect(permissionsChecker.startChecker).toBeCalledTimes(1);
        expect(permissionsChecker.checkPermissions).toBeCalledTimes(0);

        // advance timers for 24 hours + 100 ms
        jest.advanceTimersByTime(UPDATE_CREDENTIALS_INTERVAL_MS + 100);
        expect(permissionsChecker.checkPermissions).toBeCalledTimes(1);

        // advance timers for 24 hours + 100 ms
        jest.advanceTimersByTime(UPDATE_CREDENTIALS_INTERVAL_MS + 100);
        expect(permissionsChecker.checkPermissions).toBeCalledTimes(2);
    });

    it('Check vpn info every hour', () => {
        permissionsChecker.init();
        notifier.notifyListeners(notifier.types.USER_AUTHENTICATED);
        // advance timers for 1 hour + 100 ms
        jest.advanceTimersByTime(UPDATE_VPN_INFO_INTERVAL_MS + 100);
        expect(permissionsChecker.getVpnInfo).toBeCalledTimes(1);

        // advance timers for 1 hour + 100 ms
        jest.advanceTimersByTime(UPDATE_VPN_INFO_INTERVAL_MS + 100);
        expect(permissionsChecker.getVpnInfo).toBeCalledTimes(2);
    });

    it('Check permissions in half an hour before credentials expired', () => {
        credentials.init();
        permissionsChecker.credentials.vpnCredentials = getCredentialsData(TEST_PERIOD_SEC);
        permissionsChecker.init();
        notifier.notifyListeners(notifier.types.USER_AUTHENTICATED);
        expect(permissionsChecker.checkPermissions).toBeCalledTimes(0);

        // advance timers for 5 hours
        jest.advanceTimersByTime(TEST_PERIOD_SEC * 1000);
        expect(permissionsChecker.checkPermissions).toBeCalledTimes(1);
    });

    it('Check permissions in half an hour before ACTUAL credentials expired', () => {
        credentials.init();
        permissionsChecker.credentials.vpnCredentials = getCredentialsData(TEST_PERIOD_SEC);
        permissionsChecker.init();
        notifier.notifyListeners(notifier.types.USER_AUTHENTICATED);
        expect(permissionsChecker.checkPermissions).toBeCalledTimes(0);

        // advance timers for 1 hour
        jest.advanceTimersByTime((TEST_PERIOD_SEC * 1000) / 5);

        expect(permissionsChecker.checkPermissions).toBeCalledTimes(0);

        permissionsChecker.credentials.vpnCredentials = getCredentialsData(TEST_PERIOD_SEC * 2);
        notifier.notifyListeners(notifier.types.USER_DEAUTHENTICATED);
        notifier.notifyListeners(notifier.types.USER_AUTHENTICATED);

        // advance timers for 12 hours
        jest.advanceTimersByTime(TEST_PERIOD_SEC * 1000 * 2 + 100);
        expect(permissionsChecker.checkPermissions).toBeCalledTimes(1);
    });
});
