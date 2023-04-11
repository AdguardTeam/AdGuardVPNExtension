import { locationsService } from '../../../src/background/endpoints/locationsService';
import { Location, LocationData } from '../../../src/background/endpoints/Location';
import * as pingHelpers from '../../../src/background/connectivity/pingHelpers';
import { vpnProvider } from '../../../src/background/providers/vpnProvider';
import { endpoints } from '../../../src/background/endpoints';
import { credentials } from '../../../src/background/credentials';
import type { VpnTokenData, EndpointInterface } from '../../../src/background/schema';
import { session } from '../../__mocks__';
// TODO: test mv3 after official switch to mv3
import { sessionState } from '../../../src/background/stateStorage/mv2';

jest.mock('../../../src/background/sessionStorage', () => {
    // eslint-disable-next-line global-require
    return require('../../../src/background/stateStorage/mv2');
});

jest.mock('../../../src/background/connectivity/pingHelpers');
jest.mock('../../../src/lib/logger'); // hides redundant log messages during test run
jest.mock('../../../src/background/settings');
jest.mock('../../../src/background/browserApi');
jest.mock('../../../src/background/providers/vpnProvider');

global.chrome = {
    storage: {
        // @ts-ignore - partly implementation
        session,
    },
};

describe('location service', () => {
    beforeEach(async () => {
        await sessionState.init();
    });
    it('by default it tries to connect to previously selected endpoint', async () => {
        const firstEndpoint = {
            id: 'gc-gb-lhr-01-1r06zxq6.adguard.io',
            ipv4Address: '5.188.5.159',
            ipv6Address: '2a03:90c0:144:0:0:0:0:1ac',
            domainName: 'gc-gb-lhr-01-1r06zxq6.adguard.io',
            publicKey: 'ZoYeWoAAE1bQcttHSs+eiRStKgaL8x0e+yNNeItDf14=',
        };

        const secondEndpoint = {
            id: 'gc-gb-lhr-02-02lxzgeu.adguard.io',
            ipv4Address: '92.223.59.29',
            ipv6Address: '2a03:90c0:144:0:0:0:0:10',
            domainName: 'gc-gb-lhr-02-02lxzgeu.adguard.io',
            publicKey: 'F20OfogJ+ThcHqBXiFPBvPtFlTiPW9kkW+86WF+CtlI=',
        };

        const locationData = {
            id: 'Z2JfbG9uZG9u',
            cityName: 'London',
            countryCode: 'GB',
            countryName: 'United Kingdom',
            premiumOnly: false,
            coordinates: [-0.11, 51.5],
            endpoints: [firstEndpoint, secondEndpoint],
        };

        let disabledDomains: string[] = [];

        /**
         * Makes pingHelpers.measurePingToEndpointViaFetch for endpoint to return null
         * @param endpoint
         */
        const disableEndpoint = (endpoint: EndpointInterface) => {
            disabledDomains.push(endpoint.domainName);
        };

        const enableEndpoint = (endpoint: EndpointInterface) => {
            disabledDomains = disabledDomains.filter((d) => d !== endpoint.domainName);
        };

        const measurePingMock = jest.spyOn(pingHelpers, 'measurePingWithinLimits')
            .mockImplementation(async (domainName) => {
                if (disabledDomains.includes(domainName)) {
                    return null;
                }
                return 50;
            });

        const location = new Location(locationData as LocationData);
        const firstSearchResult = await locationsService.getEndpointByLocation(location);
        expect(firstSearchResult).toEqual(firstEndpoint);
        expect(location.available).toBeTruthy();
        expect(location.ping).toBe(50);
        expect(measurePingMock).toBeCalledTimes(1);
        expect(measurePingMock).toBeCalledWith(firstEndpoint.domainName);

        // Second call with disabled first endpoint
        disableEndpoint(firstEndpoint);
        measurePingMock.mockClear();

        const secondSearchResult = await locationsService.getEndpointByLocation(location);
        expect(secondSearchResult).toEqual(secondEndpoint);
        expect(measurePingMock).toBeCalledTimes(2);
        expect(measurePingMock).toHaveBeenNthCalledWith(1, firstEndpoint.domainName);
        expect(measurePingMock).toHaveBeenNthCalledWith(2, secondEndpoint.domainName);

        // Third call with disabled second endpoint
        enableEndpoint(firstEndpoint);
        disableEndpoint(secondEndpoint);
        measurePingMock.mockClear();

        const thirdSearchResult = await locationsService.getEndpointByLocation(location);
        expect(thirdSearchResult).toEqual(firstEndpoint);
        expect(measurePingMock).toBeCalledTimes(2);
        expect(measurePingMock).toHaveBeenNthCalledWith(1, secondEndpoint.domainName);
        expect(measurePingMock).toHaveBeenNthCalledWith(2, firstEndpoint.domainName);
    });

    it('Update selected location after got locations from server', async () => {
        const testLocationData1 = [{
            id: 'test-location',
            cityName: 'Bangkok',
            countryName: 'Thailand',
            countryCode: 'TH',
            coordinates: [123.123, 132.132],
            premiumOnly: true,
            pingBonus: 0,
            endpoints: [{
                domainName: '123.domain.org',
                id: '123.domain.org',
                ipv4Address: '188.214.106.10',
                ipv6Address: '2001:ac8:97:1:0:0:0:2',
                publicKey: 'DZeUHP1y3+fxU6kyyqmd0DB92KVSA7asv4SQZJS562E=',
            }],
        }];

        const testLocationData2 = [{
            id: 'test-location',
            cityName: 'Bangkok',
            countryName: 'Thailand',
            countryCode: 'TH',
            coordinates: [123.123, 132.132],
            premiumOnly: true,
            pingBonus: 0,
            endpoints: [{
                domainName: '123.new-domain.org',
                id: '123.new-domain.org',
                ipv4Address: '188.214.106.10',
                ipv6Address: '2001:ac8:97:1:0:0:0:2',
                publicKey: 'DZeUHP1y3+fxU6kyyqmd0DB92KVSA7asv4SQZJS562E=',
            }],
        }];

        await credentials.init();
        jest.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue({ licenseKey: '' } as VpnTokenData);
        const getLocationsDataMock = vpnProvider.getLocationsData as jest.MockedFunction<() => any>;
        getLocationsDataMock.mockImplementation(() => testLocationData1);

        let locations = await endpoints.getLocationsFromServer();
        expect(locations).toBeDefined();
        await locationsService.setSelectedLocation('test-location');
        let selectedLocation = await locationsService.getSelectedLocation();
        expect(selectedLocation).toBeDefined();
        expect(selectedLocation?.id).toBe('test-location');
        expect(selectedLocation?.endpoints[0].domainName).toBe('123.domain.org');

        getLocationsDataMock.mockImplementation(() => testLocationData2);

        locations = await endpoints.getLocationsFromServer();
        expect(locations).toBeDefined();
        selectedLocation = await locationsService.getSelectedLocation();
        expect(selectedLocation?.id).toBe('test-location');
        // endpoints of selected location should be updated
        expect(selectedLocation?.endpoints[0].domainName).toBe('123.new-domain.org');
    });
});
