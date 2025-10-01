import {
    vi,
    describe,
    beforeEach,
    afterEach,
    it,
    expect,
    type MockedFunction,
} from 'vitest';

import { connectivityService } from '../../../src/background/connectivity/connectivityService';
import { Location } from '../../../src/background/endpoints/Location';
import * as pingHelpers from '../../../src/background/connectivity/pingHelpers';
import { vpnProvider } from '../../../src/background/providers/vpnProvider';
import { endpoints } from '../../../src/background/endpoints';
import { credentials } from '../../../src/background/credentials';
import type {
    VpnTokenData,
    EndpointInterface,
    LocationData,
    LocationInterface,
} from '../../../src/background/schema';
import { locationsService, LocationsService } from '../../../src/background/endpoints/locationsService';
import { LocationsTab } from '../../../src/background/endpoints/locationsEnums';

vi.mock('../../../src/background/settings');
vi.mock('../../../src/background/providers/vpnProvider');

describe('location service', () => {
    beforeEach(async () => {
        await connectivityService.start();
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

        const locationData: LocationData = {
            id: 'Z2JfbG9uZG9u',
            cityName: 'London',
            countryCode: 'GB',
            countryName: 'United Kingdom',
            premiumOnly: false,
            coordinates: [-0.11, 51.5],
            endpoints: [firstEndpoint, secondEndpoint],
            pingBonus: 100,
            virtual: false,
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

        const measurePingMock = vi.spyOn(pingHelpers, 'measurePingWithinLimits')
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

    it('Update selected location after got locations from server', async () => {
        const testLocationData1: LocationInterface[] = [{
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
            virtual: false,
        }];

        const testLocationData2: LocationInterface[] = [{
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
            virtual: false,
        }];

        await credentials.init();
        vi.spyOn(credentials, 'gainValidVpnToken').mockResolvedValue({ licenseKey: '' } as VpnTokenData);
        const getLocationsDataMock = vpnProvider.getLocationsData as MockedFunction<() => any>;
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

    describe('SavedLocations.locationsTab', () => {
        const mockStorage = {
            get: vi.fn(),
            set: vi.fn(),
            remove: vi.fn(),
        };

        let freshLocationsService: LocationsService;

        beforeEach(() => {
            freshLocationsService = new LocationsService({
                storage: mockStorage,
            });
        });

        afterEach(() => {
            vi.clearAllMocks();
        });

        it('should read from storage and save when not exists', async () => {
            mockStorage.get.mockResolvedValue(undefined);

            const result = await freshLocationsService.getLocationsTab();

            // Should read from storage
            expect(mockStorage.get).toHaveBeenCalledTimes(1);

            // Should be default value
            expect(result).toBe(LocationsTab.All);

            // Should save to storage default value
            expect(mockStorage.set).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledWith(expect.any(String), LocationsTab.All);
        });

        it('should cache value read from storage', async () => {
            mockStorage.get.mockResolvedValue(LocationsTab.Saved);

            // Try to read twice, to see if it caches value in-memory
            const result1 = await freshLocationsService.getLocationsTab();
            const result2 = await freshLocationsService.getLocationsTab();

            // Should read from storage only once
            expect(mockStorage.get).toHaveBeenCalledTimes(1);

            // Should be value from storage
            expect(result1).toBe(LocationsTab.Saved);
            expect(result2).toBe(LocationsTab.Saved);

            // Should not save to storage because it was already there
            expect(mockStorage.set).not.toHaveBeenCalled();
        });

        it('should validate value when reading from storage', async () => {
            mockStorage.get.mockResolvedValue('invalid');

            const result = await freshLocationsService.getLocationsTab();

            // Should read from storage
            expect(mockStorage.get).toHaveBeenCalledTimes(1);

            // Should be default value
            expect(result).toBe(LocationsTab.All);

            // Should save to storage default value
            expect(mockStorage.set).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledWith(expect.any(String), LocationsTab.All);
        });

        it('should save to storage', async () => {
            await freshLocationsService.saveLocationsTab(LocationsTab.Saved);

            expect(mockStorage.set).toHaveBeenCalledTimes(1);
            expect(mockStorage.set).toHaveBeenCalledWith(expect.any(String), LocationsTab.Saved);
        });
    });
});
