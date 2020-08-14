import endpoints from '../../../src/background/endpoints';
import { sleep } from '../../../src/lib/helpers';
import settings from '../../../src/background/settings/settings';
import notifier from '../../../src/lib/notifier';
import notifications from '../../../src/background/notifications';
import vpnProvider from '../../../src/background/providers/vpnProvider';
import credentials from '../../../src/background/credentials';
import CustomError from '../../../src/lib/CustomError';
import { ERROR_STATUSES } from '../../../src/lib/constants';
import { Location } from '../../../src/background/endpoints/Location';
import { LocationWithPing } from '../../../src/background/endpoints/LocationWithPing';
import { connectivityService } from '../../../src/background/connectivity/connectivityService/connectivityFSM';
import { EVENT } from '../../../src/background/connectivity/connectivityService/connectivityConstants';
import { locationsService } from '../../../src/background/endpoints/locationsService';

jest.mock('../../../src/background/settings/settings');
jest.mock('../../../src/background/connectivity/connectivityService/connectivityFSM');
jest.mock('../../../src/lib/notifier');
jest.mock('../../../src/background/notifications');
jest.mock('../../../src/background/proxy');
jest.mock('../../../src/background/browserApi');
jest.mock('../../../src/background/providers/vpnProvider');

jest.mock('../../../src/background/endpoints/locationsService', () => ({
    ...jest.requireActual('../../../src/background/endpoints/locationsService'),
}));

describe('endpoints class', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getEndpoints returns empty list on init', async () => {
        const endpointsList = await endpoints.getLocations();
        expect(endpointsList.length).toBe(0);
    });

    it('getVpnInfo return null on init and correct value after', async () => {
        const expectedVpnInfo = {
            bandwidthFreeMbits: 1,
            premiumPromoEnabled: false,
            premiumPromoPage: 'https://adguard.io/premium.html',
            refreshTokens: false,
            remainingTraffic: 240,
            totalTraffic: 500,
            vpnFailurePage: 'https://kb.adguard.com/technical-support',
        };
        const locations = [
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
                endpoints: [
                    {
                        id: 'do-us-nyc1-01-yhxvv1yn.adguard.io',
                        ipv4Address: '159.89.232.121',
                        ipv6Address: '2604:a880:400:d1:0:0:c7d:b001',
                        domainName: 'do-us-nyc1-01-yhxvv1yn.adguard.io',
                        publicKey: 'ZrBfo/3MhaCij20biQx+b/kb2iPKVsbZFb8x/XeI5io=',
                    },
                ],
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
            },
        ];

        jest.spyOn(vpnProvider, 'getVpnExtensionInfo').mockResolvedValue(expectedVpnInfo);
        jest.spyOn(vpnProvider, 'getLocationsData').mockResolvedValue(locations);
        jest.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue('token');
        jest.spyOn(credentials, 'gainValidVpnCredentials').mockResolvedValue('vpn_credentials');

        let vpnInfo = endpoints.getVpnInfo();
        expect(vpnInfo).toBeNull();
        await sleep(10);

        vpnInfo = endpoints.getVpnInfo();

        expect(vpnInfo).toEqual(expectedVpnInfo);

        const endpointsList = await endpoints.getLocations();
        expect(endpointsList)
            .toEqual(locations.map((location) => new LocationWithPing(new Location(location))));
    });

    it('get vpn info remotely stops execution if unable to get valid token', async () => {
        jest.spyOn(credentials, 'gainValidVpnToken').mockRejectedValue(new Error('invalid token'));
        await endpoints.getVpnInfoRemotely();
        expect(credentials.gainValidVpnToken).toBeCalledTimes(2);
        expect(vpnProvider.getVpnExtensionInfo).toBeCalledTimes(0);
    });

    it('refreshes tokens if refreshTokens is true', async () => {
        const expectedVpnInfo = {
            refreshTokens: true,
        };

        jest.spyOn(vpnProvider, 'getLocationsData').mockResolvedValue([]);
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
        const rawLocations = [
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
            },
        ];

        it('returns closest location when city name is the same', () => {
            const targetRawLocation = {
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
            };

            const targetLocation = new Location(targetRawLocation);
            const locations = rawLocations.map((rawLocation) => new Location(rawLocation));

            const closestLocation = endpoints.getClosestLocation(locations, targetLocation);

            expect(new LocationWithPing(closestLocation))
                .toEqual(new LocationWithPing(targetLocation));
        });

        it('returns closest endpoint when endpoints do not have same location', () => {
            const targetRawLocation = {
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
            };

            const locations = rawLocations.map((rawLocation) => new Location(rawLocation));
            const closestLocation = endpoints.getClosestLocation(
                locations,
                new Location(targetRawLocation)
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
            });

            expect(new LocationWithPing(closestLocation))
                .toEqual(new LocationWithPing(expectedLocation));
        });
    });

    describe('handles refresh token event', () => {
        jest.spyOn(vpnProvider, 'getLocationsData').mockResolvedValue(null);
        jest.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue('vpn_token');
        jest.spyOn(credentials, 'gainValidVpnCredentials').mockResolvedValue('vpn_credentials');

        it('refreshes tokens and doesnt disable proxy', async () => {
            await endpoints.refreshData();
            expect(credentials.gainValidVpnToken).toBeCalledTimes(2);
            expect(credentials.gainValidVpnCredentials).toBeCalledTimes(1);
            expect(settings.disableProxy).toBeCalledTimes(0);
            expect(connectivityService.send).toBeCalledTimes(0);
        });

        it('refreshes tokens and disables proxy if necessary', async () => {
            jest.spyOn(credentials, 'gainValidVpnCredentials').mockRejectedValue(new CustomError(ERROR_STATUSES.LIMIT_EXCEEDED));
            await endpoints.refreshData();
            expect(credentials.gainValidVpnToken).toBeCalledTimes(1);
            expect(credentials.gainValidVpnCredentials).toBeCalledTimes(1);
            expect(connectivityService.send)
                .toBeCalledWith(EVENT.DISCONNECT_TRAFFIC_LIMIT_EXCEEDED);
            expect(notifier.notifyListeners).toBeCalledTimes(1);
            expect(notifications.create).toBeCalledTimes(1);
        });
    });

    describe('update locations', () => {
        it('updates locations from server', async () => {
            jest.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue({ licenseKey: false });
            jest.spyOn(locationsService, 'getLocationsFromServer').mockResolvedValue([]);

            await endpoints.updateLocations();
            expect(credentials.gainValidVpnToken).toBeCalledTimes(1);
            expect(locationsService.getLocationsFromServer).toBeCalledTimes(1);
        });

        it('doesnt reconnects if selected location matches token premium value', async () => {
            jest.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue({ licenseKey: true });
            jest.spyOn(locationsService, 'getSelectedLocation').mockResolvedValue({ premiumOnly: false });
            jest.spyOn(locationsService, 'getLocationsFromServer').mockResolvedValue([{}, {}]);
            jest.spyOn(endpoints, 'reconnectEndpoint');

            await endpoints.updateLocations();
            expect(endpoints.reconnectEndpoint).toBeCalledTimes(0);
        });

        it('reconnects if selected location is premiumOnly and token is not premium', async () => {
            jest.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue({ licenseKey: false });
            jest.spyOn(locationsService, 'getSelectedLocation').mockResolvedValue({ premiumOnly: true });
            jest.spyOn(locationsService, 'getLocationsFromServer').mockResolvedValue([{}, {}]);
            jest.spyOn(locationsService, 'getEndpointByLocation').mockResolvedValue({});
            jest.spyOn(endpoints, 'reconnectEndpoint').mockResolvedValue('done');

            await endpoints.updateLocations();
            expect(endpoints.reconnectEndpoint).toBeCalledTimes(1);
        });

        it('does not reconnect if selected location and token are not premium', async () => {
            jest.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue({ licenseKey: false });
            jest.spyOn(locationsService, 'getSelectedLocation').mockResolvedValue({ premiumOnly: false });
            jest.spyOn(locationsService, 'getLocationsFromServer').mockResolvedValue([{}, {}]);
            jest.spyOn(locationsService, 'getEndpointByLocation').mockResolvedValue({});
            jest.spyOn(endpoints, 'reconnectEndpoint').mockResolvedValue('done');

            await endpoints.updateLocations();
            expect(endpoints.reconnectEndpoint).toBeCalledTimes(0);
        });
    });

    // TODO [maximtop] add tests for uncovered methods of EndpointsService
});
