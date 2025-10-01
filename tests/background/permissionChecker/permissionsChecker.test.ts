import {
    vi,
    describe,
    beforeEach,
    afterEach,
    it,
    expect,
} from 'vitest';

import { permissionsChecker } from '../../../src/background/permissionsChecker';
import { notifier } from '../../../src/common/notifier';
import { SubscriptionType } from '../../../src/common/constants';
import {
    UPDATE_CREDENTIALS_INTERVAL_MS,
    UPDATE_VPN_INFO_INTERVAL_MS,
    EXPIRE_CHECK_TIME_SEC,
} from '../../../src/background/permissionsChecker/PermissionsChecker';
import { credentials } from '../../../src/background/credentials';

const emitter = (() => {
    // Default emitter that throws errors if used before being set up
    const DEFAULT_EMITTER = {
        authenticate: async (): Promise<void> => {
            throw new Error('Emitter not received callback');
        },
        deauthenticate: async (): Promise<void> => {
            throw new Error('Emitter not received callback');
        },
    };

    let emitter = { ...DEFAULT_EMITTER };

    const originalAddSpecifiedListener = notifier.addSpecifiedListener.bind(notifier);
    vi.spyOn(notifier, 'addSpecifiedListener').mockImplementation((events, callback) => {
        if (events === notifier.types.USER_AUTHENTICATED) {
            emitter.authenticate = async () => {
                await callback();
            };
            return 'listenerId';
        } if (events === notifier.types.USER_DEAUTHENTICATED) {
            emitter.deauthenticate = async () => {
                await callback();
            };
            return 'listenerId';
        }

        return originalAddSpecifiedListener(events, callback);
    });

    return {
        authenticate: async (): Promise<void> => {
            await emitter.authenticate();
        },
        deauthenticate: async (): Promise<void> => {
            await emitter.deauthenticate();
        },
        clear: (): void => {
            emitter = { ...DEFAULT_EMITTER };
        },
    };
})();

vi.spyOn(permissionsChecker, 'startChecker');
vi.spyOn(permissionsChecker, 'checkPermissions');
vi.spyOn(permissionsChecker, 'getVpnInfo');
vi.spyOn(permissionsChecker.credentials, 'gainValidVpnToken').mockResolvedValue({
    token: 'test_token',
    licenseStatus: 'VALID',
    timeExpiresSec: 23223224,
    timeExpiresIso: '1970-09-26T18:53:44+0000',
    licenseKey: 'test_key',
    vpnSubscription: {
        next_bill_date_iso: '2023-10-05T14:48:00.000Z',
        duration_v2: SubscriptionType.Monthly,
    },
});

const getVpnCredentialsStateSpy = vi.spyOn(permissionsChecker.credentials, 'getVpnCredentialsState');
const gainValidVpnCredentialsSpy = vi.spyOn(permissionsChecker.credentials, 'gainValidVpnCredentials');

vi.useFakeTimers();

describe('PermissionsChecker tests', () => {
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

    beforeEach(async () => {
        await credentials.init();
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.clearAllMocks();
        emitter.clear();
    });

    it('Check permissions every 12 hours', async () => {
        const TEST_CREDENTIALS = getCredentialsData((UPDATE_CREDENTIALS_INTERVAL_MS / 1000) * 5);
        getVpnCredentialsStateSpy.mockResolvedValueOnce(TEST_CREDENTIALS);
        gainValidVpnCredentialsSpy.mockResolvedValueOnce(TEST_CREDENTIALS);

        // simulate authentication
        permissionsChecker.init();
        await emitter.authenticate();

        // should be called right after authentication
        expect(permissionsChecker.startChecker).toBeCalledTimes(1);

        // should not be called right after authentication
        expect(permissionsChecker.checkPermissions).toBeCalledTimes(0);

        // advance timers for 12 hours:
        // should be called, first 12 hours check
        vi.advanceTimersByTime(UPDATE_CREDENTIALS_INTERVAL_MS);
        expect(permissionsChecker.checkPermissions).toBeCalledTimes(1);

        // advance timers for 11 hours 59 minutes 59 seconds 999 milliseconds:
        // should not be called yet, 1 millisecond left
        vi.advanceTimersByTime(UPDATE_CREDENTIALS_INTERVAL_MS - 1);
        expect(permissionsChecker.checkPermissions).toBeCalledTimes(1);

        // advance timers for 1 millisecond:
        // should be called, second 12 hours check
        vi.advanceTimersByTime(1);
        expect(permissionsChecker.checkPermissions).toBeCalledTimes(2);
    });

    it('Check vpn info every hour', async () => {
        const TEST_CREDENTIALS = getCredentialsData((UPDATE_CREDENTIALS_INTERVAL_MS / 1000) * 5);
        getVpnCredentialsStateSpy.mockResolvedValueOnce(TEST_CREDENTIALS);
        gainValidVpnCredentialsSpy.mockResolvedValueOnce(TEST_CREDENTIALS);

        // simulate authentication
        permissionsChecker.init();
        await emitter.authenticate();

        // should be called right after authentication
        expect(permissionsChecker.startChecker).toBeCalledTimes(1);

        // should not be called right after authentication
        expect(permissionsChecker.getVpnInfo).toBeCalledTimes(0);

        // advance timers for 1 hour:
        // should be called, first hour check
        vi.advanceTimersByTime(UPDATE_VPN_INFO_INTERVAL_MS);
        expect(permissionsChecker.getVpnInfo).toBeCalledTimes(1);

        // advance timers for 59 minutes 59 seconds 999 milliseconds:
        // should not be called yet, 1 millisecond left
        vi.advanceTimersByTime(UPDATE_VPN_INFO_INTERVAL_MS - 1);
        expect(permissionsChecker.getVpnInfo).toBeCalledTimes(1);

        // advance timers for 1 millisecond:
        // should be called, second hour check
        vi.advanceTimersByTime(1);
        expect(permissionsChecker.getVpnInfo).toBeCalledTimes(2);
    });

    it('Check permissions in half an hour before credentials expired', async () => {
        const TEST_PERIOD_SEC = 5 * 60 * 60; // 5 hours
        const TEST_CREDENTIALS = getCredentialsData(TEST_PERIOD_SEC);

        getVpnCredentialsStateSpy.mockResolvedValueOnce(TEST_CREDENTIALS);
        gainValidVpnCredentialsSpy.mockResolvedValueOnce(TEST_CREDENTIALS);

        // simulate authentication
        permissionsChecker.init();
        await emitter.authenticate();

        // should be called right after authentication
        expect(permissionsChecker.startChecker).toBeCalledTimes(1);

        // should not be called right after authentication
        expect(permissionsChecker.checkPermissions).toBeCalledTimes(0);

        // advance timers for 4 hours 59 minutes 59 seconds 999 milliseconds:
        // should not be called yet, 1 millisecond left (30 minutes 1 millisecond till expiration)
        vi.advanceTimersByTime((TEST_PERIOD_SEC - EXPIRE_CHECK_TIME_SEC) * 1000 - 1);
        expect(permissionsChecker.checkPermissions).toBeCalledTimes(0);

        // advance timers for 1 millisecond:
        // should be called, 30 minutes till expiration
        vi.advanceTimersByTime(1);
        expect(permissionsChecker.checkPermissions).toBeCalledTimes(1);
    });
});
