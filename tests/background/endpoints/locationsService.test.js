import { locationsService } from '../../../src/background/endpoints/locationsService';
import { Location } from '../../../src/background/endpoints/Location';
import * as pingHelpers from '../../../src/background/connectivity/pingHelpers';

jest.mock('../../../src/background/connectivity/pingHelpers');
jest.mock('../../../src/lib/logger'); // hides redundant log messages during test run

describe('location service', () => {
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

        let disabledDomains = [];

        /**
         * Makes pingHelpers.measurePingToEndpointViaFetch for endpoint to return null
         * @param endpoint
         */
        const disableEndpoint = (endpoint) => {
            disabledDomains.push(endpoint.domainName);
        };

        const enableEndpoint = (endpoint) => {
            disabledDomains = disabledDomains.filter((d) => d !== endpoint.domainName);
        };

        const measurePingMock = jest.spyOn(pingHelpers, 'measurePingToEndpointViaFetch')
            .mockImplementation(async (domainName) => {
                if (disabledDomains.includes(domainName)) {
                    return null;
                }
                return 50;
            });

        const location = new Location(locationData);
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
});
