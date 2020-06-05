import endpoints from '../../../src/background/endpoints';
import { sleep } from '../../../src/lib/helpers';
import settings from '../../../src/background/settings/settings';
import notifier from '../../../src/lib/notifier';
import notifications from '../../../src/background/notifications';
import vpnProvider from '../../../src/background/providers/vpnProvider';
import credentials from '../../../src/background/credentials';
import CustomError from '../../../src/lib/CustomError';
import { ERROR_STATUSES } from '../../../src/lib/constants';

jest.mock('../../../src/background/settings/settings');
jest.mock('../../../src/lib/notifier');
jest.mock('../../../src/background/notifications');
jest.mock('../../../src/background/proxy');
jest.mock('../../../src/background/browserApi');
jest.mock('../../../src/background/providers/vpnProvider');

describe('endpoints class', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getEndpoints returns null on init', async () => {
        const endpointsList = await endpoints.getEndpoints();
        expect(endpointsList).toBeNull();
    });

    it('getVpnInfo return null on init and right value after', async () => {
        const expectedVpnInfo = {
            bandwidthFreeMbits: 1,
            premiumPromoEnabled: false,
            premiumPromoPage: 'https://adguard.io/premium.html',
            refreshTokens: false,
            remainingTraffic: 240,
            totalTraffic: 500,
            vpnFailurePage: 'https://kb.adguard.com/technical-support',
        };
        const expectedEndpoints = {
            backupEndpoints: {},
            endpoints: {
                'do-ca-tor1-01-jbnyx56n.adguard.io': {
                    id: 'do-ca-tor1-01-jbnyx56n.adguard.io',
                    cityName: 'Toronto',
                    countryCode: 'CA',
                    countryName: 'Canada',
                    domainName: 'do-ca-tor1-01-jbnyx56n.adguard.io',
                    coordinates: [-79.34, 43.65],
                    premiumOnly: false,
                    publicKey: 'l+4CZN7RIFsnU/UgIse3BHJC1fzUHbNJh51lIfPOQQ8=',
                },
                'do-de-fra1-01.adguard.io': {
                    id: 'do-de-fra1-01.adguard.io',
                    cityName: 'Frankfurt',
                    countryCode: 'DE',
                    countryName: 'Germany',
                    domainName: 'do-de-fra1-01.adguard.io',
                    coordinates: [8.68, 50.11],
                    premiumOnly: false,
                    publicKey: 'UXKhYwlbiRKYa115QjsOdET6ibB4rEnbQDSECoHTXBM=',
                },
                'do-gb-lon1-01-hk7z7xez.adguard.io': {
                    id: 'do-gb-lon1-01-hk7z7xez.adguard.io',
                    cityName: 'London',
                    countryCode: 'GB',
                    countryName: 'United Kingdom',
                    domainName: 'do-gb-lon1-01-hk7z7xez.adguard.io',
                    coordinates: [-0.11, 51.5],
                    premiumOnly: false,
                    publicKey: 'uj63wPR3XdE2k7xmtNNoRpWwEF56UBxKtIfKelQu9BM=',
                },
            },
        };

        jest.spyOn(vpnProvider, 'getVpnExtensionInfo').mockResolvedValue(expectedVpnInfo);
        jest.spyOn(vpnProvider, 'getEndpoints').mockResolvedValue(expectedEndpoints);
        jest.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue('token');
        jest.spyOn(credentials, 'gainValidVpnCredentials').mockResolvedValue('vpn_credentials');

        let vpnInfo = endpoints.getVpnInfo();
        expect(vpnInfo).toBeNull();
        await sleep(10);

        vpnInfo = endpoints.getVpnInfo();

        expect(vpnInfo).toEqual(expectedVpnInfo);

        const endpointsList = await endpoints.getEndpoints();
        expect(Object.keys(endpointsList)).toEqual(Object.keys(expectedEndpoints.endpoints));
    });

    it('get vpn info remotely stops execution if unable to get valid token', async () => {
        jest.spyOn(credentials, 'gainValidVpnToken').mockRejectedValue(new Error('invalid token'));
        await endpoints.getVpnInfoRemotely();
        expect(credentials.gainValidVpnToken).toBeCalledTimes(1);
        expect(vpnProvider.getVpnExtensionInfo).toBeCalledTimes(0);
    });

    it('refreshes tokens if refreshTokens is true', async () => {
        const expectedVpnInfo = {
            refreshTokens: true,
        };

        jest.spyOn(vpnProvider, 'getEndpoints').mockResolvedValue({ endpoints: [] });
        jest.spyOn(vpnProvider, 'getVpnExtensionInfo').mockResolvedValue(expectedVpnInfo);
        jest.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue('vpn_token');
        jest.spyOn(credentials, 'gainValidVpnCredentials').mockResolvedValue('vpn_credentials');

        await endpoints.getVpnInfoRemotely();
        expect(credentials.gainValidVpnToken).toBeCalledTimes(3);
        expect(credentials.gainValidVpnToken).nthCalledWith(2, true, false);
        expect(credentials.gainValidVpnCredentials).toBeCalledTimes(1);
        expect(credentials.gainValidVpnCredentials).lastCalledWith(true, false);
    });

    describe('returns closest endpoint', () => {
        const endpointsList = {
            'do-ca-tor1-01-jbnyx56n.adguard.io': {
                id: 'do-ca-tor1-01-jbnyx56n.adguard.io',
                cityName: 'Toronto',
                countryCode: 'CA',
                countryName: 'Canada',
                domainName: 'do-ca-tor1-01-jbnyx56n.adguard.io',
                coordinates: [-79.34, 43.65],
                premiumOnly: false,
                publicKey: 'l+4CZN7RIFsnU/UgIse3BHJC1fzUHbNJh51lIfPOQQ8=',
            },
            'do-de-fra1-01.adguard.io': {
                id: 'do-de-fra1-01.adguard.io',
                cityName: 'Frankfurt',
                countryCode: 'DE',
                countryName: 'Germany',
                domainName: 'do-de-fra1-01.adguard.io',
                coordinates: [8.68, 50.11],
                premiumOnly: false,
                publicKey: 'UXKhYwlbiRKYa115QjsOdET6ibB4rEnbQDSECoHTXBM=',
            },
            'do-gb-lon1-01-hk7z7xez.adguard.io': {
                id: 'do-gb-lon1-01-hk7z7xez.adguard.io',
                cityName: 'London',
                countryCode: 'GB',
                countryName: 'United Kingdom',
                domainName: 'do-gb-lon1-01-hk7z7xez.adguard.io',
                coordinates: [-0.11, 51.5],
                premiumOnly: false,
                publicKey: 'uj63wPR3XdE2k7xmtNNoRpWwEF56UBxKtIfKelQu9BM=',
            },
        };


        it('returns closest endpoint when city name is the same', () => {
            const currentEndpoint = {
                id: 'do-de-fra1-01.adguard.io',
                cityName: 'Frankfurt',
                countryCode: 'DE',
                countryName: 'Germany',
                domainName: 'do-de-fra1-01.adguard.io',
                coordinates: [8.68, 50.11],
                premiumOnly: false,
                publicKey: 'UXKhYwlbiRKYa115QjsOdET6ibB4rEnbQDSECoHTXBM=',
            };
            const closestEndpoint = endpoints.getClosestEndpoint(endpointsList, currentEndpoint);

            expect(closestEndpoint).toEqual(currentEndpoint);
        });

        it('returns closest endpoint when city name is not the same by coordinates', () => {
            const currentEndpoint = {
                id: 'do-nl-ams3-1.adguard.io',
                cityName: 'Amsterdam',
                countryCode: 'NL',
                countryName: 'Netherlands',
                domainName: 'do-nl-ams3-1.adguard.io',
                coordinates: [4.89, 52.37],
                premiumOnly: false,
                publicKey: 'B+1zqYFIR/NSm0PC/UrouNz43xajQhK1IFXM4wKGiyw=',
            };

            const closestEndpoint = endpoints.getClosestEndpoint(endpointsList, currentEndpoint);

            const expectedEndpoint = {
                id: 'do-gb-lon1-01-hk7z7xez.adguard.io',
                cityName: 'London',
                countryCode: 'GB',
                countryName: 'United Kingdom',
                domainName: 'do-gb-lon1-01-hk7z7xez.adguard.io',
                coordinates: [-0.11, 51.5],
                premiumOnly: false,
                publicKey: 'uj63wPR3XdE2k7xmtNNoRpWwEF56UBxKtIfKelQu9BM=',
            };

            expect(closestEndpoint).toEqual(expectedEndpoint);
        });
    });

    describe('handles refresh token event', () => {
        jest.spyOn(vpnProvider, 'getEndpoints').mockResolvedValue(null);
        jest.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue('vpn_token');
        jest.spyOn(credentials, 'gainValidVpnCredentials').mockResolvedValue('vpn_credentials');

        it('refreshes tokens and doesnt disable proxy', async () => {
            await endpoints.handleRefreshTokenEvent();
            expect(credentials.gainValidVpnToken).toBeCalledTimes(2);
            expect(credentials.gainValidVpnCredentials).toBeCalledTimes(1);
            expect(settings.disableProxy).toBeCalledTimes(0);
        });

        it('refreshes tokens and disables proxy if necessary', async () => {
            jest.spyOn(credentials, 'gainValidVpnCredentials').mockRejectedValue(new CustomError(ERROR_STATUSES.LIMIT_EXCEEDED));
            await endpoints.handleRefreshTokenEvent();
            expect(credentials.gainValidVpnToken).toBeCalledTimes(1);
            expect(credentials.gainValidVpnCredentials).toBeCalledTimes(1);
            expect(settings.disableProxy).toBeCalledTimes(1);
            expect(notifier.notifyListeners).toBeCalledTimes(1);
            expect(notifications.create).toBeCalledTimes(1);
        });
    });

    // TODO [maximtop] add tests for uncovered methods of EndpointsService
});
