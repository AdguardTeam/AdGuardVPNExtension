import { Credentials } from '../../../src/background/credentials/Credentials';
import { SubscriptionType } from '../../../src/common/constants';
import { credentialsService } from '../../../src/background/credentials/credentialsService';
import { browserApi } from '../../../src/background/browserApi';
import type { VpnTokenData, CredentialsDataInterface } from '../../../src/background/schema';
import { stateStorage } from '../../../src/background/stateStorage';

jest.mock('../../../src/background/config', () => ({ FORWARDER_URL_QUERIES: {} }));

jest.mock('../../../src/background/auth', () => {
    return {
        isAuthenticated: () => true,
    };
});

jest.mock('../../../src/background/appStatus', () => {
    return {
        version: () => '2.0.16',
    };
});

jest.mock('../../../src/common/logger');

const storageImplementation: { [key: string]: any } = {};
jest.mock('../../../src/background/browserApi', () => {
    return {
        browserApi: {
            storage: {
                set: jest.fn((key, data) => {
                    storageImplementation[key] = data;
                }),
                get: jest.fn((key) => {
                    return storageImplementation[key];
                }),
                remove: jest.fn((key) => {
                    return delete storageImplementation[key];
                }),
            },
        },
    };
});

const msToSec = (ms: number) => {
    return Math.floor(ms / 1000);
};

describe('Credentials', () => {
    beforeEach(async () => {
        await stateStorage.init();
    });

    afterEach(async () => {
        jest.clearAllMocks();
    });

    describe('validates credentials', () => {
        // @ts-ignore - partly implementation
        const credentials = new Credentials({ browserApi });

        it('returns false if empty or undefined credentials are provided', () => {
            expect(credentials.areCredentialsValid(null)).toBeFalsy();

            expect(credentials.areCredentialsValid({
                licenseStatus: 'VALID',
                result: { credentials: 'fd7d2sh3wep5h5lm', expiresInSec: 69558 },
                timeExpiresSec: msToSec(Date.now()) + 1,
            })).toBeTruthy();
        });

        it('returns false if credentials without valid status are provided', () => {
            expect(credentials.areCredentialsValid({
                licenseStatus: 'INVALID',
                result: { credentials: 'fd7d2sh3wep5h5lm', expiresInSec: 69558 },
                timeExpiresSec: msToSec(Date.now()) + 1,
            })).toBeFalsy();
        });

        it('returns false if credentials timeExpiresSec is behind current time by one sec', () => {
            expect(credentials.areCredentialsValid({
                licenseStatus: 'VALID',
                result: { credentials: 'fd7d2sh3wep5h5lm', expiresInSec: 69558 },
                timeExpiresSec: msToSec(Date.now()) - 1,
            })).toBeFalsy();
        });

        it('returns false if credentials licenseStatus or timeExpiresSec are undefined', () => {
            expect(credentials.areCredentialsValid({
                result: { credentials: 'fd7d2sh3wep5h5lm', expiresInSec: 69558 },
                timeExpiresSec: msToSec(Date.now()) - 1,
            } as CredentialsDataInterface)).toBeFalsy();

            expect(credentials.areCredentialsValid({
                licenseStatus: 'VALID',
                result: { credentials: 'fd7d2sh3wep5h5lm', expiresInSec: 69558 },
            } as CredentialsDataInterface)).toBeFalsy();
        });
    });

    describe('validates vpn token', () => {
        // @ts-ignore - partly implementation
        const credentials = new Credentials({ browserApi });
        it('returns false if no token provided', () => {
            expect(credentials.isTokenValid(null)).toBeFalsy();
        });

        it('returns true for valid token', () => {
            expect(credentials.isTokenValid({
                token: 'f0e92752-1f38-4f46-9edd-55176a99e4fe',
                licenseStatus: 'VALID',
                timeExpiresSec: msToSec(Date.now()) + 1,
                licenseKey: '',
                vpnSubscription: {},
            } as VpnTokenData)).toBeTruthy();
        });

        it('returns false if licenseStatus is not valid', () => {
            expect(credentials.isTokenValid({
                token: 'f0e92752-1f38-4f46-9edd-55176a99e4fe',
                licenseStatus: 'INVALID',
                timeExpiresSec: msToSec(Date.now()) + 1,
                licenseKey: '',
                vpnSubscription: {},
            } as VpnTokenData)).toBeFalsy();
        });

        it('returns false if no licenseStatus or timeExpiresSec fields', () => {
            expect(credentials.isTokenValid({
                token: 'f0e92752-1f38-4f46-9edd-55176a99e4fe',
                timeExpiresSec: msToSec(Date.now()) + 1,
                licenseKey: '',
                vpnSubscription: {},
            } as VpnTokenData)).toBeFalsy();

            expect(credentials.isTokenValid({
                token: 'f0e92752-1f38-4f46-9edd-55176a99e4fe',
                licenseStatus: 'VALID',
                licenseKey: '',
                timeExpiresSec: 0,
                timeExpiresIso: '1970-09-26T18:53:44+0000',
                vpnSubscription: {
                    next_bill_date_iso: '',
                    duration_v2: SubscriptionType.Monthly,
                },
            })).toBeFalsy();
        });

        it('returns false if timeExpiresSec is more than current time', () => {
            expect(credentials.isTokenValid({
                token: 'f0e92752-1f38-4f46-9edd-55176a99e4fe',
                licenseStatus: 'VALID',
                timeExpiresSec: msToSec(Date.now()) - 1,
                timeExpiresIso: '1970-09-26T18:53:44+0000',
                licenseKey: '',
                vpnSubscription: {
                    next_bill_date_iso: '',
                    duration_v2: SubscriptionType.Monthly,
                },
            })).toBeFalsy();
        });
    });

    describe('get vpn local', () => {
        afterEach(() => {
            jest.clearAllMocks();
        });

        it('returns nothing if there is no token in the storage', async () => {
            // @ts-ignore - partly implementation
            const credentials = new Credentials({ browserApi });
            await credentials.init();

            const vpnToken = await credentials.getVpnTokenLocal();
            expect(vpnToken).toEqual(null);
        });

        it('retrieves token from storage if token is not defined', async () => {
            const expectedVpnToken = {
                token: 'f0e92752-1f38-4f46-9edd-55176a99e4fe',
                licenseStatus: 'VALID',
                timeExpiresSec: 4728282135,
                timeExpiresIso: '1970-09-26T18:53:44+0000',
                licenseKey: '',
                vpnSubscription: {
                    next_bill_date_iso: '20240101',
                    duration_v2: SubscriptionType.Yearly,
                },
            };

            await credentialsService.setVpnTokenToStorage(expectedVpnToken);
            // @ts-ignore - partly implementation
            const credentials = new Credentials({ browserApi });
            await credentials.init();
            const vpnToken = await credentials.getVpnTokenLocal();
            expect(vpnToken).toEqual(expectedVpnToken);
        });

        it('caches vpn token in memory', async () => {
            const expectedVpnToken = {
                token: 'f0e92752-1f38-4f46-9edd-55176a99e4fe',
                licenseStatus: 'VALID',
                timeExpiresSec: 4728282135,
                timeExpiresIso: '1970-09-26T18:53:44+0000',
                licenseKey: '',
                vpnSubscription: {
                    next_bill_date_iso: '20240101',
                    duration_v2: SubscriptionType.Yearly,
                },
            };

            const getVpnTokenFromStorageMock = jest.fn();
            credentialsService.getVpnTokenFromStorage = getVpnTokenFromStorageMock;
            getVpnTokenFromStorageMock.mockReturnValue(expectedVpnToken);

            // @ts-ignore - partly implementation
            const credentials = new Credentials({ browserApi });
            await credentials.init();

            let vpnToken = await credentials.getVpnTokenLocal();
            expect(vpnToken).toEqual(expectedVpnToken);
            expect(credentialsService.getVpnTokenFromStorage).toBeCalledTimes(0);
            vpnToken = await credentials.getVpnTokenLocal();
            expect(vpnToken).toEqual(expectedVpnToken);
            expect(credentialsService.getVpnTokenFromStorage).toBeCalledTimes(0);
        });
    });
});
