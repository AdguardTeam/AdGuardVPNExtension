import EndpointsService from '../../../src/background/endpoints/EndpointsService';
import { sleep } from '../../../src/lib/helpers';

const browserApi = {
    runtime: {
        sendMessage: async () => {

        },
    },
    storage: {
        get: jest.fn(),
    },
};

const proxy = {
    getCurrentEndpoint: async () => {

    },
};

const buildCredentials = (throwError = false) => {
    if (throwError) {
        return {
            gainValidVpnToken: jest
                .fn()
                .mockRejectedValue(new Error('invalid token')),
        };
    }
    return {
        gainValidVpnToken: jest
            .fn(async () => {
                return 'token';
            }),
        gainValidVpnCredentials: jest
            .fn()
            .mockResolvedValue('vpn credentials'),
    };
};

const connectivity = {
    endpointConnectivity: {
        getPing: jest.fn(),
    },
};

const buildVpnProvider = (vpnInfo, endpoints) => {
    return {
        getVpnExtensionInfo: jest
            .fn()
            .mockResolvedValue(vpnInfo),
        getEndpoints: jest
            .fn()
            .mockResolvedValue(endpoints),
    };
};

describe('endpoints class', () => {
    it('getEndpoints returns null on init', async () => {
        const credentials = buildCredentials();
        const vpnProvider = buildVpnProvider();
        const endpoints = new EndpointsService({
            browserApi,
            proxy,
            credentials,
            connectivity,
            vpnProvider,
        });
        const endpointsList = endpoints.getEndpoints();
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
            overTrafficLimits: false,
        };
        const expectedEndpoints = {
            'do-ca-tor1-01-jbnyx56n.adguard.io': {
                id: 'do-ca-tor1-01-jbnyx56n.adguard.io',
                cityName: 'Toronto',
                countryCode: 'CA',
                countryName: 'Canada',
                domainName: 'do-ca-tor1-01-jbnyx56n.adguard.io',
                coordinates: [-79.34, 43.65],
                premiumOnly: false,
                publicKey: 'l+4CZN7RIFsnU/UgIse3BHJC1fzUHbNJh51lIfPOQQ8=',
                ping: 70,
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
                ping: 231,
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
                ping: 259,
            },
        };

        const vpnProvider = buildVpnProvider(expectedVpnInfo, expectedEndpoints);

        const endpointsService = new EndpointsService({
            browserApi,
            proxy,
            credentials: buildCredentials(),
            connectivity,
            vpnProvider,
        });

        let vpnInfo = endpointsService.getVpnInfo();
        expect(vpnInfo).toBeNull();
        await sleep(10);

        vpnInfo = endpointsService.getVpnInfo();

        expect(vpnInfo).toEqual(expectedVpnInfo);

        const endpoints = endpointsService.getEndpoints();
        expect(endpoints.all).toEqual(expectedEndpoints);
    });

    it('get vpn info remotely stops execution if unable to get valid token', async () => {
        const vpnProvider = buildVpnProvider();
        const credentials = buildCredentials(true);
        const endpoints = new EndpointsService({
            browserApi,
            proxy,
            credentials,
            connectivity,
            vpnProvider,
        });
        await endpoints.getVpnInfoRemotely();
        expect(credentials.gainValidVpnToken).toBeCalledTimes(1);
        expect(endpoints.getVpnInfo()).toBeNull();
        expect(endpoints.getEndpoints()).toBeNull();
    });

    it('refreshes tokens if refreshTokens is true', async () => {
        const expectedVpnInfo = {
            refreshTokens: true,
        };
        const vpnProvider = buildVpnProvider(expectedVpnInfo);
        const credentials = buildCredentials();
        const endpoints = new EndpointsService({
            browserApi,
            proxy,
            credentials,
            connectivity,
            vpnProvider,
        });
        await endpoints.getVpnInfoRemotely();
        expect(credentials.gainValidVpnToken).toBeCalledTimes(3);
        expect(credentials.gainValidVpnToken).nthCalledWith(2, true, false);
        expect(credentials.gainValidVpnCredentials).toBeCalledTimes(1);
        expect(credentials.gainValidVpnCredentials).lastCalledWith(true, false);
    });

    describe('returns closest endpoint', () => {
        const endpointsService = new EndpointsService({ browserApi });
        const endpoints = {
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
            const closestEndpoint = endpointsService.getClosestEndpoint(endpoints, currentEndpoint);

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

            const closestEndpoint = endpointsService.getClosestEndpoint(endpoints, currentEndpoint);

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

    it('determines if user is over traffic limits', () => {
        const vpnProvider = buildVpnProvider();
        const credentials = buildCredentials();
        const endpoints = new EndpointsService({
            browserApi,
            proxy,
            credentials,
            connectivity,
            vpnProvider,
        });

        expect(endpoints.isOverTrafficLimits(null)).toBeFalsy();

        expect(endpoints.isOverTrafficLimits({
            usedDownloadedBytes: 50,
            usedUploadedBytes: 50,
            maxDownloadedBytes: 0,
            maxUploadedBytes: 100,
        })).toBeFalsy();

        expect(endpoints.isOverTrafficLimits({
            usedDownloadedBytes: 50,
            usedUploadedBytes: 50,
            maxDownloadedBytes: 0,
            maxUploadedBytes: 0,
        })).toBeFalsy();

        expect(endpoints.isOverTrafficLimits({
            usedDownloadedBytes: 100,
            usedUploadedBytes: 100,
            maxDownloadedBytes: 0,
            maxUploadedBytes: 100,
        })).toBeTruthy();

        expect(endpoints.isOverTrafficLimits({
            usedDownloadedBytes: 100,
            usedUploadedBytes: 50,
            maxDownloadedBytes: 100,
            maxUploadedBytes: 100,
        })).toBeTruthy();
    });

    // TODO [maximtop] add tests for uncovered methods of EndpointsService
});
