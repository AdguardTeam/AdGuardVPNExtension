import {
    vi,
    describe,
    beforeEach,
    it,
    expect,
} from 'vitest';

import { endpoints } from '../../../src/background/endpoints';
import { settings } from '../../../src/background/settings';
import { vpnProvider } from '../../../src/background/providers/vpnProvider';
import { credentials } from '../../../src/background/credentials';
import { Location } from '../../../src/background/endpoints/Location';
import { LocationDto } from '../../../src/background/endpoints/LocationDto';
import { connectivityService } from '../../../src/background/connectivity/connectivityService';
import { locationsService } from '../../../src/background/endpoints/locationsService';
import { proxy } from '../../../src/background/proxy';
import { endpointsTldExclusions } from '../../../src/background/proxy/endpointsTldExclusions';
import type {
    VpnTokenData,
    EndpointInterface,
    CredentialsDataInterface,
    LocationInterface,
    LocationData,
} from '../../../src/background/schema';
import { locationScheme, locationsServiceStateScheme } from '../../../src/background/schema';
import { stateStorage } from '../../../src/background/stateStorage/stateStorage';
import type { VpnExtensionInfoInterface } from '../../../src/common/schema/endpoints/vpnInfo';

vi.mock('../../../src/background/settings');
vi.mock('../../../src/background/connectivity/connectivityService');

vi.mock('../../../src/background/api/fallbackApi', () => {
    return {
        __esModule: true,
        fallbackApi: {
            getApiUrlsExclusions: () => {
                return [];
            },
        },
    };
});

describe('Endpoints', () => {
    beforeEach(async () => {
        // Reset stateStorage singleton to avoid state leakage between tests
        stateStorage.resetForTesting();

        // Clear session storage mock to avoid state leakage between tests
        const { sessionStorageMock } = await import('../../__mocks__/sessionStorageMock');
        await sessionStorageMock.clear();
        await endpointsTldExclusions.init();
        vi.clearAllMocks();
    });

    // FIXME consider removing, since there is no value in this test
    // AG-49612: Verify the schema includes ping and available fields
    it('locationScheme should preserve ping and available', () => {
        const testLocation = {
            id: 'test123',
            countryName: 'United States',
            cityName: 'New York',
            countryCode: 'US',
            endpoints: [],
            coordinates: [1.0, 2.0] as [number, number],
            premiumOnly: false,
            pingBonus: 0,
            virtual: false,
            ping: 999,
            available: true,
            endpoint: null,
        };

        const result = locationScheme.safeParse(testLocation);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.ping).toBe(999);
            expect(result.data.available).toBe(true);
        }
    });

    // AG-49612: Verify locationsServiceStateScheme preserves ping and available
    it('locationsServiceStateScheme should preserve ping and available in locations array', () => {
        const testState = {
            locations: [{
                id: 'test123',
                countryName: 'United States',
                cityName: 'New York',
                countryCode: 'US',
                endpoints: [],
                coordinates: [1.0, 2.0] as [number, number],
                premiumOnly: false,
                pingBonus: 0,
                virtual: false,
                ping: 888,
                available: true,
                endpoint: null,
            }],
            selectedLocation: null,
        };

        const result = locationsServiceStateScheme.safeParse(testState);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.locations[0].ping).toBe(888);
            expect(result.data.locations[0].available).toBe(true);
        }
    });

    // AG-49612: Verify Location constructor preserves ping and available
    it('Location constructor should preserve backend ping and available', () => {
        const locationData = {
            id: 'test-loc',
            cityName: 'Test City',
            countryCode: 'TC',
            countryName: 'Test Country',
            coordinates: [1.0, 2.0] as [number, number],
            premiumOnly: false,
            endpoints: [],
            pingBonus: 0,
            virtual: false,
            ping: 999,
            available: true,
        };

        const location = new Location(locationData);

        expect(location.ping).toBe(999);
        expect(location.available).toBe(true);
    });

    // AG-49612: Verify setLocations -> getLocationDtos preserves ping and available
    it('setLocations followed by getLocationDtos should preserve backend ping and available', async () => {
        const testLocations: LocationInterface[] = [{
            id: 'test-storage-loc',
            cityName: 'Storage Test City',
            countryCode: 'ST',
            countryName: 'Storage Test Country',
            coordinates: [1.0, 2.0] as [number, number],
            premiumOnly: false,
            endpoints: [{
                id: 'test-endpoint',
                domainName: 'test.adguard.io',
                ipv4Address: '1.2.3.4',
                ipv6Address: '::1',
                publicKey: 'testkey=',
            }],
            pingBonus: 0,
            virtual: false,
            ping: 555,
            available: true,
        }];

        // Create Location instances
        const locations = testLocations.map((loc) => new Location(loc));

        // Verify Location constructor preserves values
        expect(locations[0].ping).toBe(555);
        expect(locations[0].available).toBe(true);

        // Store them via locationsService
        await locationsService.setLocations(locations);

        // Retrieve and verify
        const retrievedLocations = await locationsService.getLocationDtos();

        expect(retrievedLocations.length).toBe(1);
        expect(retrievedLocations[0].id).toBe('test-storage-loc');
        expect(retrievedLocations[0].ping).toBe(555);
        expect(retrievedLocations[0].available).toBe(true);
    });

    it('getEndpoints returns empty list on init', async () => {
        const endpointsList = await endpoints.getLocations();
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
                available: true,
                endpoints: [
                    {
                        id: 'do-us-nyc1-01-yhxvv1yn.adguard.io',
                        ipv4Address: '159.89.232.121',
                        ipv6Address: '2604:a880:400:d1:0:0:c7d:b001',
                        domainName: 'do-us-nyc1-01-yhxvv1yn.adguard.io',
                        publicKey: 'ZrBfo/3MhaCij20biQx+b/kb2iPKVsbZFb8x/XeI5io=',
                    },
                ],
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
                premiumOnly: true,
                ping: 999,
                available: true,
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
                pingBonus: 0,
                virtual: false,
            },
        ];

        vi.spyOn(vpnProvider, 'getVpnExtensionInfo').mockResolvedValue(expectedVpnInfo);
        vi.spyOn(vpnProvider, 'getLocationsData').mockResolvedValue(locations);
        vi.spyOn(credentials, 'getAppId').mockResolvedValue('test_app_id');
        vi.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue({ token: 'token' } as VpnTokenData);
        vi.spyOn(credentials, 'gainValidVpnCredentials').mockResolvedValue({ result: { credentials: 'vpn_credentials' } } as CredentialsDataInterface);

        await proxy.init();
        await endpoints.init();
        const vpnInfo = await endpoints.getVpnInfo();

        expect(vpnInfo).toEqual(expectedVpnInfo);

        const endpointsList = await endpoints.getLocations();

        // Verify locations count
        expect(endpointsList.length).toBe(locations.length);

        // Verify location basic data is correctly returned
        expect(endpointsList[0].id).toBe(locations[0].id);
        expect(endpointsList[0].cityName).toBe(locations[0].cityName);
        expect(endpointsList[0].countryCode).toBe(locations[0].countryCode);
        expect(endpointsList[0].premiumOnly).toBe(locations[0].premiumOnly);

        expect(endpointsList[1].id).toBe(locations[1].id);
        expect(endpointsList[1].cityName).toBe(locations[1].cityName);
        expect(endpointsList[1].countryCode).toBe(locations[1].countryCode);
        expect(endpointsList[1].premiumOnly).toBe(locations[1].premiumOnly);

        // AG-49612: Verify backend ping and available values are preserved
        // Note: ping/available may be undefined if not yet measured or if schema strips them
        // The key behavior is that we use backend values rather than local measurement
        expect(endpointsList[0].ping).toBe(locations[0].ping);
        expect(endpointsList[0].available).toBe(locations[0].available);
        expect(endpointsList[1].ping).toBe(locations[1].ping);
        expect(endpointsList[1].available).toBe(locations[1].available);
    });

    it('get vpn info remotely stops execution if unable to get valid token', async () => {
        vi.spyOn(credentials, 'gainValidVpnToken').mockRejectedValue(new Error('invalid token'));
        await endpoints.getVpnInfoRemotely();
        expect(credentials.gainValidVpnToken).toBeCalledTimes(1);
        expect(vpnProvider.getVpnExtensionInfo).toBeCalledTimes(0);
    });

    it('refreshes tokens if refreshTokens is true', async () => {
        const expectedVpnInfo = {
            refreshTokens: true,
        } as VpnExtensionInfoInterface;

        vi.spyOn(vpnProvider, 'getLocationsData').mockResolvedValue([]);
        vi.spyOn(vpnProvider, 'getVpnExtensionInfo').mockResolvedValue(expectedVpnInfo);
        vi.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue({ token: 'vpn_token' } as VpnTokenData);
        vi.spyOn(credentials, 'gainValidVpnCredentials')
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
                ping: null,
                available: true,
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
                ping: null,
                available: true,
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
                ping: null,
                available: true,
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
                ping: null,
                available: true,
            };

            const targetLocation = new Location(targetRawLocation);
            const locations = rawLocations.map((rawLocation) => new Location(rawLocation));

            const closestLocation = endpoints.getClosestLocation(locations, targetLocation);

            expect(new LocationDto(closestLocation))
                .toEqual(new LocationDto(targetLocation));
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
                ping: null,
                available: true,
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
                ping: null,
                available: true,
            });

            expectedLocation.ping = 50;

            expect(new LocationDto(closestLocation))
                .toEqual(new LocationDto(expectedLocation));
        });
    });

    describe('handles refresh token event', () => {
        vi.spyOn(vpnProvider, 'getLocationsData').mockResolvedValue([]);
        vi.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue({ token: 'vpn_token' } as VpnTokenData);
        vi.spyOn(credentials, 'gainValidVpnCredentials').mockResolvedValue({ result: { credentials: 'vpn_credentials' } } as CredentialsDataInterface);

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
        const locations: LocationInterface[] = [{
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
            pingBonus: 0,
            virtual: false,
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
            pingBonus: 0,
            virtual: false,
        }];

        it('updates locations from server', async () => {
            vi.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue({ licenseKey: '' } as VpnTokenData);
            vi.spyOn(locationsService, 'getLocationsFromServer').mockResolvedValue([]);

            await endpoints.updateLocations();
            expect(credentials.gainValidVpnToken).toBeCalledTimes(1);
            expect(locationsService.getLocationsFromServer).toBeCalledTimes(1);
        });

        it('does not reconnect if selected location matches token premium value', async () => {
            vi.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue({ licenseKey: '' } as VpnTokenData);
            vi.spyOn(locationsService, 'getSelectedLocation').mockResolvedValue({ premiumOnly: false } as LocationInterface);
            vi.spyOn(locationsService, 'getLocationsFromServer').mockResolvedValue(locations as Location[]);
            vi.spyOn(endpoints, 'reconnectEndpoint');

            await proxy.init();
            await endpoints.updateLocations();
            expect(endpoints.reconnectEndpoint).toBeCalledTimes(0);
        });

        it('reconnects if selected location is premiumOnly and token is not premium', async () => {
            vi.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue({ licenseKey: '' } as VpnTokenData);
            vi.spyOn(locationsService, 'getSelectedLocation').mockResolvedValue({ premiumOnly: true } as LocationInterface);
            vi.spyOn(locationsService, 'getLocationsFromServer').mockResolvedValue(locations as Location[]);
            vi.spyOn(locationsService, 'getEndpointByLocation').mockResolvedValue({} as EndpointInterface);
            vi.spyOn(endpoints, 'reconnectEndpoint').mockResolvedValue();

            await endpoints.updateLocations();
            expect(endpoints.reconnectEndpoint).toBeCalledTimes(1);
        });

        it('does not reconnect if selected location and token are not premium', async () => {
            vi.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue({ licenseKey: '' } as VpnTokenData);
            vi.spyOn(locationsService, 'getSelectedLocation').mockResolvedValue({ premiumOnly: false } as LocationInterface);
            vi.spyOn(locationsService, 'getLocationsFromServer').mockResolvedValue(locations as Location[]);
            vi.spyOn(locationsService, 'getEndpointByLocation').mockResolvedValue({} as EndpointInterface);
            vi.spyOn(endpoints, 'reconnectEndpoint').mockResolvedValue();

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

            vi.spyOn(locationsService, 'getLocationsFromServer').mockResolvedValue(locations as Location[]);
            const applyConfigSpy = vi.spyOn(proxy, 'applyConfig');

            await endpoints.init();
            await endpoints.updateLocations();
            await proxy.init();

            const { defaultExclusions } = await proxy.getConfig();

            expect(defaultExclusions).toContain(`*.${tld1}`);
            expect(defaultExclusions).toContain(`*.${tld2}`);
            // applyConfig may be called multiple times during init/update flow
            expect(applyConfigSpy).toHaveBeenCalled();
        });
    });
});
