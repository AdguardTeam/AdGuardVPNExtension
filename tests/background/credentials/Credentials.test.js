import Credentials from '../../../src/background/credentials/Credentials';

const browserApi = {};

const msToSec = (ms) => {
    return Math.floor(ms / 1000);
};

describe('Credentials', () => {
    describe('validates credentials', () => {
        const credentials = new Credentials({ browserApi });

        it('returns false if empty or undefined credentials are provided', () => {
            expect(credentials.areCredentialsValid()).toBeFalsy();

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
            })).toBeFalsy();

            expect(credentials.areCredentialsValid({
                licenseStatus: 'VALID',
                result: { credentials: 'fd7d2sh3wep5h5lm', expiresInSec: 69558 },
            })).toBeFalsy();
        });
    });

    describe('validates vpn token', () => {
        const credentials = new Credentials({ browserApi });
        it('returns false if no token provided', () => {
            expect(credentials.isTokenValid()).toBeFalsy();
        });

        it('returns true for valid token', () => {
            expect(credentials.isTokenValid({
                token: 'f0e92752-1f38-4f46-9edd-55176a99e4fe',
                licenseStatus: 'VALID',
                timeExpiresSec: msToSec(Date.now()) + 1,
                licenseKey: null,
                subscription: null,
            })).toBeTruthy();
        });

        it('returns false if licenseStatus is not valid', () => {
            expect(credentials.isTokenValid({
                token: 'f0e92752-1f38-4f46-9edd-55176a99e4fe',
                licenseStatus: 'INVALID',
                timeExpiresSec: msToSec(Date.now()) + 1,
                licenseKey: null,
                subscription: null,
            })).toBeFalsy();
        });

        it('returns false if no licenseStatus or timeExpiresSec fields', () => {
            expect(credentials.isTokenValid({
                token: 'f0e92752-1f38-4f46-9edd-55176a99e4fe',
                timeExpiresSec: msToSec(Date.now()) + 1,
                licenseKey: null,
                subscription: null,
            })).toBeFalsy();

            expect(credentials.isTokenValid({
                token: 'f0e92752-1f38-4f46-9edd-55176a99e4fe',
                licenseStatus: 'VALID',
                licenseKey: null,
                subscription: null,
            })).toBeFalsy();
        });

        it('returns false if timeExpiresSec is more than current time', () => {
            expect(credentials.isTokenValid({
                token: 'f0e92752-1f38-4f46-9edd-55176a99e4fe',
                licenseStatus: 'VALID',
                timeExpiresSec: msToSec(Date.now()) - 1,
                licenseKey: null,
                subscription: null,
            })).toBeFalsy();
        });
    });

    describe('get vpn local', () => {
        const CREDENTIALS_KEY = 'credentials.token';
        const buildBrowserApi = (vpnToken) => {
            return {
                storage: {
                    get: jest.fn(async (key) => {
                        if (key === CREDENTIALS_KEY) {
                            return vpnToken;
                        }
                        return undefined;
                    }),
                },
            };
        };

        it('retrieves token from storage if token is not defined', async () => {
            const expectedVpnToken = {
                token: 'f0e92752-1f38-4f46-9edd-55176a99e4fe',
                licenseStatus: 'VALID',
                timeExpiresSec: 4728282135,
                licenseKey: null,
                subscription: null,
            };

            const browserApi = buildBrowserApi(expectedVpnToken);
            const credentials = new Credentials({ browserApi });
            const vpnToken = await credentials.getVpnTokenLocal();
            expect(vpnToken).toEqual(expectedVpnToken);
        });

        it('returns nothing if there is not token in the storage', async () => {
            const browserApi = buildBrowserApi();
            const credentials = new Credentials({ browserApi });
            const vpnToken = await credentials.getVpnTokenLocal();
            expect(vpnToken).toEqual(undefined);
        });

        it('caches vpn token in memory', async () => {
            const expectedVpnToken = {
                token: 'f0e92752-1f38-4f46-9edd-55176a99e4fe',
                licenseStatus: 'VALID',
                timeExpiresSec: 4728282135,
                licenseKey: null,
                subscription: null,
            };
            const browserApi = buildBrowserApi(expectedVpnToken);
            const credentials = new Credentials({ browserApi });

            let vpnToken = await credentials.getVpnTokenLocal();
            expect(vpnToken).toEqual(expectedVpnToken);
            expect(browserApi.storage.get).toBeCalledTimes(1);
            vpnToken = await credentials.getVpnTokenLocal();
            expect(vpnToken).toEqual(expectedVpnToken);
            expect(browserApi.storage.get).toBeCalledTimes(1);
            expect(browserApi.storage.get).toBeCalledWith(CREDENTIALS_KEY);
        });
    });
});
