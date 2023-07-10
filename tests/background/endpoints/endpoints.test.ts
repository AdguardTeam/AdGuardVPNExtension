import { endpoints } from '../../../src/background/endpoints';
import { settings } from '../../../src/background/settings';
import { vpnProvider } from '../../../src/background/providers/vpnProvider';
import { credentials } from '../../../src/background/credentials';
import { Location } from '../../../src/background/endpoints/Location';
import { LocationWithPing } from '../../../src/background/endpoints/LocationWithPing';
import { connectivityService } from '../../../src/background/connectivity/connectivityService';
import { locationsService } from '../../../src/background/endpoints/locationsService';
import { proxy } from '../../../src/background/proxy';
import { endpointsTldExclusions } from '../../../src/background/proxy/endpointsTldExclusions';
import type {
    VpnTokenData,
    EndpointInterface,
    VpnExtensionInfoInterface,
    CredentialsDataInterface,
    LocationInterface,
    LocationData,
} from '../../../src/background/schema';
import { session } from '../../__mocks__';
// TODO: test mv3 after official switch to mv3
import { stateStorage } from '../../../src/background/stateStorage/mv2';

jest.mock('../../../src/background/stateStorage', () => {
    // eslint-disable-next-line global-require
    return require('../../../src/background/stateStorage/mv2');
});

jest.mock('../../../src/background/settings');
jest.mock('../../../src/background/connectivity/connectivityService');
jest.mock('../../../src/lib/notifier');
jest.mock('../../../src/background/notifications');
jest.mock('../../../src/background/providers/vpnProvider');
jest.mock('../../../src/lib/logger');
jest.mock('../../../src/background/api/fallbackApi');

jest.mock('../../../src/background/endpoints/locationsService', () => ({
    ...jest.requireActual('../../../src/background/endpoints/locationsService'),
}));

jest.mock('../../../src/background/api/fallbackApi', () => {
    return {
        __esModule: true,
        fallbackApi: {
            getApiUrlsExclusions: () => {
                return [];
            },
        },
    };
});

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

describe('Endpoints', () => {
    beforeEach(async () => {
        await stateStorage.init();
        await endpointsTldExclusions.init();
        jest.clearAllMocks();
        locationsService.init();
    });

    it('getEndpoints returns empty list on init', async () => {
        const endpointsList = endpoints.getLocations();
        expect(endpointsList.length).toBe(0);
    });

    it('getVpnInfo return correct value on init', async () => {
        const expectedVpnInfo = {
            bandwidthFreeMbits: 1,
            premiumPromoEnabled: false,
            premiumPromoPage: 'https://adguard.io/premium.html',
            refreshTokens: false,
            vpnFailurePage: 'https://kb.adguard.com/technical-support',
        } as VpnExtensionInfoInterface;
        const locations: LocationInterface[] = [
            {
                id: 'VVNfTmV3IFlvcms=',
                cityName: 'New York',
                countryCode: 'US',
                countryName: 'United States',
                coordinates: [
                    -73.93,
                    40.73,
                ],
                premiumOnly: false,
                ping: 999,
                endpoints: [
                    {
                        id: 'do-us-nyc1-01-yhxvv1yn.adguard.io',
                        ipv4Address: '159.89.232.121',
                        ipv6Address: '2604:a880:400:d1:0:0:c7d:b001',
                        domainName: 'do-us-nyc1-01-yhxvv1yn.adguard.io',
                        publicKey: 'ZrBfo/3MhaCij20biQx+b/kb2iPKVsbZFb8x/XeI5io=',
                    },
                ],
            } as LocationInterface,
            {
                id: 'SlBfVG9reW8=',
                cityName: 'Tokyo',
                countryCode: 'JP',
                countryName: 'Japan',
                coordinates: [
                    139.83,
                    35.65,
                ],
                premiumOnly: true,
                ping: 999,
                endpoints: [
                    {
                        id: 'vultr-jp-nrt-01-0c73irq5.adguard.io',
                        ipv4Address: '149.28.28.5',
                        ipv6Address: '2001:19f0:7001:348:5400:2ff:fe8b:6dde',
                        domainName: 'vultr-jp-nrt-01-0c73irq5.adguard.io',
                        publicKey: 'Z4ubgRrPCqo7NhauABFD+t7kL7zHv4/tsFHIGWnBsWU=',
                    },
                    {
                        id: 'vultr-jp-nrt-02-m270gbtk.adguard.io',
                        ipv4Address: '45.76.98.118',
                        ipv6Address: '2401:c080:1000:48af:5400:2ff:fe9d:3974',
                        domainName: 'vultr-jp-nrt-02-m270gbtk.adguard.io',
                        publicKey: 'Km7jSE/TBdD81IEXc+FrNAUjgz24BNQ8t1bQiz5w7GU=',
                    },
                ],
            } as LocationInterface,
        ];

        jest.spyOn(vpnProvider, 'getVpnExtensionInfo').mockResolvedValue(expectedVpnInfo);
        jest.spyOn(vpnProvider, 'getLocationsData').mockResolvedValue(locations);
        jest.spyOn(credentials, 'getAppId').mockResolvedValue('test_app_id');
        jest.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue({ token: 'token' } as VpnTokenData);
        jest.spyOn(credentials, 'gainValidVpnCredentials').mockResolvedValue({ result: { credentials: 'vpn_credentials' } } as CredentialsDataInterface);

        await proxy.init();
        await endpoints.init();
        const vpnInfo = await endpoints.getVpnInfo();

        expect(vpnInfo).toEqual(expectedVpnInfo);

        const endpointsList = endpoints.getLocations();
        expect(endpointsList)
            .toEqual(locations.map((location) => {
                return new LocationWithPing(new Location(location));
            }));
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
        } as VpnExtensionInfoInterface;

        jest.spyOn(vpnProvider, 'getLocationsData').mockResolvedValue([]);
        jest.spyOn(vpnProvider, 'getVpnExtensionInfo').mockResolvedValue(expectedVpnInfo);
        jest.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue({ token: 'vpn_token' } as VpnTokenData);
        jest.spyOn(credentials, 'gainValidVpnCredentials')
            .mockResolvedValue({ result: { credentials: 'vpn_credentials' } } as CredentialsDataInterface);

        await endpoints.getVpnInfoRemotely();
        expect(credentials.gainValidVpnToken).toBeCalledTimes(3);
        expect(credentials.gainValidVpnToken).nthCalledWith(2, true, false);
        expect(credentials.gainValidVpnCredentials).toBeCalledTimes(1);
        expect(credentials.gainValidVpnCredentials).lastCalledWith(true, false);
    });

    describe('returns closest endpoint', () => {
        const rawLocations: LocationInterface[] = [
            {
                id: 'VVNfTmV3IFlvcms=',
                cityName: 'New York',
                countryCode: 'US',
                countryName: 'United States',
                coordinates: [
                    -73.93,
                    40.73,
                ],
                endpoints: [
                    {
                        id: 'do-us-nyc1-01-yhxvv1yn.adguard.io',
                        ipv4Address: '159.89.232.121',
                        ipv6Address: '2604:a880:400:d1:0:0:c7d:b001',
                        domainName: 'do-us-nyc1-01-yhxvv1yn.adguard.io',
                        publicKey: 'ZrBfo/3MhaCij20biQx+b/kb2iPKVsbZFb8x/XeI5io=',
                    },
                ],
                premiumOnly: false,
                pingBonus: 0,
                virtual: false,
            },
            {
                id: 'SlBfVG9reW8=',
                cityName: 'Tokyo',
                countryCode: 'JP',
                countryName: 'Japan',
                coordinates: [
                    139.83,
                    35.65,
                ],
                endpoints: [
                    {
                        id: 'vultr-jp-nrt-01-0c73irq5.adguard.io',
                        ipv4Address: '149.28.28.5',
                        ipv6Address: '2001:19f0:7001:348:5400:2ff:fe8b:6dde',
                        domainName: 'vultr-jp-nrt-01-0c73irq5.adguard.io',
                        publicKey: 'Z4ubgRrPCqo7NhauABFD+t7kL7zHv4/tsFHIGWnBsWU=',
                    },
                    {
                        id: 'vultr-jp-nrt-02-m270gbtk.adguard.io',
                        ipv4Address: '45.76.98.118',
                        ipv6Address: '2401:c080:1000:48af:5400:2ff:fe9d:3974',
                        domainName: 'vultr-jp-nrt-02-m270gbtk.adguard.io',
                        publicKey: 'Km7jSE/TBdD81IEXc+FrNAUjgz24BNQ8t1bQiz5w7GU=',
                    },
                ],
                premiumOnly: false,
                pingBonus: 0,
                virtual: false,
            },
            {
                id: 'VVNfTWlhbWk=',
                cityName: 'Miami',
                countryCode: 'US',
                countryName: 'United States',
                coordinates: [
                    -80.19,
                    25.76,
                ],
                endpoints: [
                    {
                        id: 'vultr-us-mia-01-4jmbzqfn.adguard.io',
                        ipv4Address: '45.32.172.174',
                        ipv6Address: '2001:19f0:9002:96a:5400:2ff:fe68:2271',
                        domainName: 'vultr-us-mia-01-4jmbzqfn.adguard.io',
                        publicKey: 'ivhrodHsK9ZDd6f7HU3VaywrwN61W5DOjRjpyBZa6RM=',
                    },
                ],
                premiumOnly: false,
                pingBonus: 0,
                virtual: false,
            },
        ];

        it('returns closest location when city name is the same', () => {
            const targetRawLocation: LocationData = {
                id: 'VVNfTWlhbWk=',
                cityName: 'Miami',
                countryCode: 'US',
                countryName: 'United States',
                coordinates: [
                    -80.19,
                    25.76,
                ],
                endpoints: [
                    {
                        id: 'vultr-us-mia-01-4jmbzqfn.adguard.io',
                        ipv4Address: '45.32.172.174',
                        ipv6Address: '2001:19f0:9002:96a:5400:2ff:fe68:2271',
                        domainName: 'vultr-us-mia-01-4jmbzqfn.adguard.io',
                        publicKey: 'ivhrodHsK9ZDd6f7HU3VaywrwN61W5DOjRjpyBZa6RM=',
                    },
                ],
                premiumOnly: false,
                pingBonus: 0,
                virtual: false,
            };

            const targetLocation = new Location(targetRawLocation);
            const locations = rawLocations.map((rawLocation) => new Location(rawLocation));

            const closestLocation = endpoints.getClosestLocation(locations, targetLocation);

            expect(new LocationWithPing(closestLocation))
                .toEqual(new LocationWithPing(targetLocation));
        });

        it('returns closest endpoint when endpoints do not have same location', () => {
            const targetRawLocation: LocationData = {
                id: 'VVNfU2lsaWNvbiBWYWxsZXk=',
                cityName: 'Silicon Valley',
                countryCode: 'US',
                countryName: 'United States',
                coordinates: [
                    -122.04,
                    37.37,
                ],
                endpoints: [
                    {
                        id: 'vultr-us-sjc-01-lse37xqc.adguard.io',
                        ipv4Address: '149.28.214.166',
                        ipv6Address: '2001:19f0:ac01:12fd:5400:2ff:fe68:23c1',
                        domainName: 'vultr-us-sjc-01-lse37xqc.adguard.io',
                        publicKey: '63cR1XNVgkP3Xp0iSE/dm18tGDj4BMcl6xHWDni77A0=',
                    },
                ],
                premiumOnly: false,
                pingBonus: 0,
                virtual: false,
            };

            const locations = rawLocations.map((rawLocation) => {
                const location = new Location(rawLocation);
                if (location.cityName === 'New York') {
                    location.ping = 50;
                } else {
                    location.ping = 100;
                }
                return location;
            });

            const closestLocation = endpoints.getClosestLocation(
                locations,
                new Location(targetRawLocation),
            );

            const expectedLocation = new Location({
                id: 'VVNfTmV3IFlvcms=',
                cityName: 'New York',
                countryCode: 'US',
                countryName: 'United States',
                coordinates: [
                    -73.93,
                    40.73,
                ],
                endpoints: [
                    {
                        id: 'do-us-nyc1-01-yhxvv1yn.adguard.io',
                        ipv4Address: '159.89.232.121',
                        ipv6Address: '2604:a880:400:d1:0:0:c7d:b001',
                        domainName: 'do-us-nyc1-01-yhxvv1yn.adguard.io',
                        publicKey: 'ZrBfo/3MhaCij20biQx+b/kb2iPKVsbZFb8x/XeI5io=',
                    },
                ],
                premiumOnly: false,
                pingBonus: 0,
                virtual: false,
            });

            expectedLocation.ping = 50;

            expect(new LocationWithPing(closestLocation))
                .toEqual(new LocationWithPing(expectedLocation));
        });
    });

    describe('handles refresh token event', () => {
        jest.spyOn(vpnProvider, 'getLocationsData').mockResolvedValue([]);
        jest.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue({ token: 'vpn_token' } as VpnTokenData);
        jest.spyOn(credentials, 'gainValidVpnCredentials').mockResolvedValue({ result: { credentials: 'vpn_credentials' } } as CredentialsDataInterface);

        it('refreshes tokens and doesnt disable proxy', async () => {
            await credentials.init();
            await endpoints.refreshData();
            expect(credentials.gainValidVpnToken).toBeCalledTimes(2);
            expect(credentials.gainValidVpnCredentials).toBeCalledTimes(1);
            expect(settings.disableProxy).toBeCalledTimes(0);
            expect(connectivityService.send).toBeCalledTimes(0);
        });
    });

    describe('update locations', () => {
        const locations = [{
            id: 'dHJfaXN0YW5idWw=',
            countryName: 'Turkey',
            cityName: 'Istanbul',
            countryCode: 'TR',
            endpoints: [{
                id: 'gc-tr-ist-01-dsff7616.adguard.io',
                ipv4Address: '5.188.168.159',
                ipv6Address: '2a03:90c0:164:0:0:0:0:86',
                domainName: 'gc-tr-ist-01-dsff7616.adguard.io',
                publicKey: 'jbCiJKa8SpEWhtTpcOWeroDtPf3KSmATM5bTH0/FmnA=',
            }, {
                id: 'gc-tr-ist-02-2olm42nx.adguard.io',
                ipv4Address: '5.188.168.72',
                ipv6Address: '2a03:90c0:164:0:0:0:0:1e',
                domainName: 'gc-tr-ist-02-2olm42nx.adguard.io',
                publicKey: 'Md/silAlCxKeots719Yd53I9GxhrWMTt3rUX09zoyAc=',
            }],
            coordinates: [28.9651646, 41.0096334],
            premiumOnly: true,
            available: true,
            ping: null,
            endpoint: null,
        }, {
            id: 'dXNfZGFsbGFz',
            countryName: 'United States',
            cityName: 'Dallas',
            countryCode: 'US',
            endpoints: [{
                id: 'vultr-us-dfw-02-6my6ng8i.adguard.io',
                ipv4Address: '207.148.1.240',
                ipv6Address: '2001:19f0:6401:18c3:5400:2ff:fee8:df13',
                domainName: 'vultr-us-dfw-02-6my6ng8i.adguard.io',
                publicKey: 'I4/dVacB+LJRCdT9DGQYqUvxiRUSYqM4BR2lRu4aV0w=',
            }],
            coordinates: [-97.04, 32.89],
            premiumOnly: true,
            available: true,
            ping: null,
            endpoint: null,
        }];

        it('updates locations from server', async () => {
            jest.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue({ licenseKey: '' } as VpnTokenData);
            jest.spyOn(locationsService, 'getLocationsFromServer').mockResolvedValue([]);

            await endpoints.updateLocations();
            expect(credentials.gainValidVpnToken).toBeCalledTimes(1);
            expect(locationsService.getLocationsFromServer).toBeCalledTimes(1);
        });

        it('does not reconnect if selected location matches token premium value', async () => {
            jest.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue({ licenseKey: '' } as VpnTokenData);
            jest.spyOn(locationsService, 'getSelectedLocation').mockResolvedValue({ premiumOnly: false } as LocationInterface);
            jest.spyOn(locationsService, 'getLocationsFromServer').mockResolvedValue(locations as Location[]);
            jest.spyOn(endpoints, 'reconnectEndpoint');

            await proxy.init();
            await endpoints.updateLocations();
            expect(endpoints.reconnectEndpoint).toBeCalledTimes(0);
        });

        it('reconnects if selected location is premiumOnly and token is not premium', async () => {
            jest.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue({ licenseKey: '' } as VpnTokenData);
            jest.spyOn(locationsService, 'getSelectedLocation').mockResolvedValue({ premiumOnly: true } as LocationInterface);
            jest.spyOn(locationsService, 'getLocationsFromServer').mockResolvedValue(locations as Location[]);
            jest.spyOn(locationsService, 'getEndpointByLocation').mockResolvedValue({} as EndpointInterface);
            jest.spyOn(endpoints, 'reconnectEndpoint').mockResolvedValue();

            await endpoints.updateLocations();
            expect(endpoints.reconnectEndpoint).toBeCalledTimes(1);
        });

        it('does not reconnect if selected location and token are not premium', async () => {
            jest.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue({ licenseKey: '' } as VpnTokenData);
            jest.spyOn(locationsService, 'getSelectedLocation').mockResolvedValue({ premiumOnly: false } as LocationInterface);
            jest.spyOn(locationsService, 'getLocationsFromServer').mockResolvedValue(locations as Location[]);
            jest.spyOn(locationsService, 'getEndpointByLocation').mockResolvedValue({} as EndpointInterface);
            jest.spyOn(endpoints, 'reconnectEndpoint').mockResolvedValue();

            await endpoints.updateLocations();
            expect(endpoints.reconnectEndpoint).toBeCalledTimes(0);
        });

        it('updates endpoints tld exclusions', async () => {
            const tld1 = 'adguard.io';
            const tld2 = 'internet-protection.co';
            const locations = [
                {
                    endpoints: [{
                        domainName: `gc-tr-ist-01-dsff7616.${tld1}`,
                    }, {
                        domainName: `gc-tr-ist-02-2olm42nx.${tld1}`,
                    }],
                }, {
                    endpoints: [{
                        domainName: `vultr-us-dfw-02-6my6ng8i.${tld2}`,
                    }],
                }];

            jest.spyOn(locationsService, 'getLocationsFromServer').mockResolvedValue(locations as Location[]);
            jest.spyOn(proxy, 'applyConfig');

            await endpoints.init();
            await endpoints.updateLocations();
            await proxy.init();

            const { defaultExclusions } = await proxy.getConfig();

            expect(defaultExclusions).toContain(`*.${tld1}`);
            expect(defaultExclusions).toContain(`*.${tld2}`);
            expect(proxy.applyConfig).toBeCalledTimes(1);
        });
    });
});
