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
import { profilesService } from '../../../src/background/profiles';
import { notifier } from '../../../src/common/notifier';
import * as helpers from '../../../src/common/helpers';
import { settings } from '../../../src/background/settings';
import { DEFAULT_PROFILE_SETTINGS } from '../../../src/background/schema';
import { QuickConnectSetting } from '../../../src/common/constants';

vi.mock('../../../src/background/settings');
vi.mock('../../../src/background/providers/vpnProvider');
vi.mock('../../../src/background/profiles', () => ({
    profilesService: {
        getActiveProfileId: vi.fn().mockReturnValue('default'),
        getActiveProfileSettings: vi.fn().mockReturnValue({ selectedLocation: null }),
        getProfileSettings: vi.fn().mockReturnValue({
            selectedLocation: null,
            quickConnect: 'lastUsedLocation',
        }),
        updateProfileSettings: vi.fn().mockImplementation(
            async (_id: string, _patch: unknown, onApply?: () => Promise<void>) => {
                if (onApply) {
                    await onApply();
                }
            },
        ),
        getProfilesData: vi.fn().mockResolvedValue({ activeProfileId: 'default', profiles: [] }),
    },
}));

describe('location service', () => {
    beforeEach(async () => {
        await connectivityService.start();

        // Restore the default profile mocks: `restoreAllMocks` in the nested
        // suites resets their implementations between tests.
        vi.mocked(profilesService.getActiveProfileId).mockReturnValue('default');
        vi.mocked(profilesService.getActiveProfileSettings).mockReturnValue({
            ...DEFAULT_PROFILE_SETTINGS,
            selectedLocation: null,
            quickConnect: QuickConnectSetting.LastUsedLocation,
        });
        vi.mocked(profilesService.getProfileSettings).mockReturnValue({
            ...DEFAULT_PROFILE_SETTINGS,
            selectedLocation: null,
            quickConnect: QuickConnectSetting.LastUsedLocation,
        });
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
        await locationsService.setSelectedLocation('default', 'test-location');
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

    describe('backend-provided pings', () => {
        const makeEndpoint = (domain: string): EndpointInterface => ({
            id: domain,
            domainName: domain,
            ipv4Address: '1.2.3.4',
            ipv6Address: '::1',
            publicKey: 'testkey=',
        });

        const makeLocationData = (
            id: string,
            ping?: number | null,
        ): LocationData => ({
            id,
            cityName: `City-${id}`,
            countryName: `Country-${id}`,
            countryCode: 'XX',
            coordinates: [0, 0],
            premiumOnly: false,
            pingBonus: 0,
            endpoints: [makeEndpoint(`${id}.endpoint.test`)],
            virtual: false,
            ping,
        });

        let measurePingMock: MockedFunction<typeof pingHelpers.measurePingWithinLimits>;

        beforeEach(() => {
            measurePingMock = vi.fn().mockResolvedValue(42);
            vi.spyOn(pingHelpers, 'measurePingWithinLimits').mockImplementation(measurePingMock);
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('location with backend ping is displayed with that value and available: true, no local measurement', async () => {
            const location = new Location(makeLocationData('backend-loc', 150));

            expect(location.ping).toBe(150);
            expect(location.available).toBe(true);

            await locationsService.setLocations([location]);

            const locationsWithPing = await locationsService.getLocationsWithPing();
            const loc = locationsWithPing.find((l) => l.id === 'backend-loc');
            expect(loc?.ping).toBe(150);
            expect(loc?.available).toBe(true);
            expect(measurePingMock).not.toHaveBeenCalled();
        });

        it('location with ping: null falls back to local measurement', async () => {
            const location = new Location(makeLocationData('local-loc', null));

            expect(location.ping).toBeNull();

            await locationsService.setLocations([location]);

            expect(measurePingMock).toHaveBeenCalledWith('local-loc.endpoint.test');
        });

        it('mixed response: backend-pinged locations skip measurement, null-pinged are measured', async () => {
            const backendLoc = new Location(makeLocationData('be-loc', 200));
            const localLoc = new Location(makeLocationData('lo-loc', null));

            await locationsService.setLocations([backendLoc, localLoc]);

            expect(measurePingMock).toHaveBeenCalledTimes(1);
            expect(measurePingMock).toHaveBeenCalledWith('lo-loc.endpoint.test');

            const locationsWithPing = await locationsService.getLocationsWithPing();
            const be = locationsWithPing.find((l) => l.id === 'be-loc');
            const lo = locationsWithPing.find((l) => l.id === 'lo-loc');
            expect(be?.ping).toBe(200);
            expect(be?.available).toBe(true);
            expect(lo?.ping).toBe(42);
            expect(lo?.available).toBe(true);
        });

        it('ping: 0 is treated as valid', async () => {
            const location = new Location(makeLocationData('zero-loc', 0));

            expect(location.ping).toBe(0);

            await locationsService.setLocations([location]);

            const locationsWithPing = await locationsService.getLocationsWithPing();
            const loc = locationsWithPing.find((l) => l.id === 'zero-loc');
            expect(loc?.ping).toBe(0);
            expect(loc?.available).toBe(true);
            expect(measurePingMock).not.toHaveBeenCalled();
        });

        it('negative ping is treated as invalid and falls back to local measurement', async () => {
            const location = new Location(makeLocationData('neg-loc', -5));

            expect(location.ping).toBeNull();

            await locationsService.setLocations([location]);

            expect(measurePingMock).toHaveBeenCalledWith('neg-loc.endpoint.test');
        });

        it('fresh backend ping is not overwritten by stale cache on refresh', async () => {
            // First load: location has no backend ping, local measurement fails
            const loc1 = new Location(makeLocationData('stale-loc', null));
            measurePingMock.mockResolvedValueOnce(null);
            await locationsService.setLocations([loc1]);

            // Cache now has { ping: null, available: false } for 'stale-loc'
            const cacheAfterFirst = await locationsService.getPingFromCache('stale-loc');
            expect(cacheAfterFirst.ping).toBeNull();

            measurePingMock.mockClear();

            // Refresh: backend now provides ping 200 for this location
            const loc2 = new Location(makeLocationData('stale-loc', 200));
            await locationsService.setLocations([loc2]);

            // Backend ping must take precedence over stale null cache
            const locationsWithPing = await locationsService.getLocationsWithPing();
            const loc = locationsWithPing.find((l) => l.id === 'stale-loc');
            expect(loc?.ping).toBe(200);
            expect(loc?.available).toBe(true);
            expect(measurePingMock).not.toHaveBeenCalled();
        });

        it('refresh (re-fetch) delivers fresh backend pings without local measurement', async () => {
            await credentials.init();
            vi.spyOn(credentials, 'gainValidVpnToken')
                .mockResolvedValue({ licenseKey: '' } as VpnTokenData);

            type ActiveProfileSettings = ReturnType<typeof profilesService.getActiveProfileSettings>;
            vi.mocked(profilesService.getActiveProfileSettings)
                .mockReturnValue({ selectedLocation: null } as ActiveProfileSettings);

            const getLocationsDataMock = vpnProvider.getLocationsData as MockedFunction<() => any>;

            getLocationsDataMock.mockImplementation(() => [
                makeLocationData('refresh-loc', 300),
            ]);

            await endpoints.getLocationsFromServer();

            const locationsWithPing = await locationsService.getLocationsWithPing();
            const loc = locationsWithPing.find((l) => l.id === 'refresh-loc');
            expect(loc?.ping).toBe(300);
            expect(loc?.available).toBe(true);
            expect(measurePingMock).not.toHaveBeenCalled();
        });
    });

    describe('setSelectedLocation with profileId', () => {
        const makeEndpoint = (domain: string): EndpointInterface => ({
            id: domain,
            domainName: domain,
            ipv4Address: '1.2.3.4',
            ipv6Address: '::1',
            publicKey: 'testkey=',
        });

        const testLocation: LocationInterface = {
            id: 'loc-berlin',
            cityName: 'Berlin',
            countryName: 'Germany',
            countryCode: 'DE',
            coordinates: [13.4, 52.52],
            premiumOnly: false,
            pingBonus: 0,
            endpoints: [makeEndpoint('de.endpoint.test')],
            virtual: false,
        };

        beforeEach(async () => {
            vi.spyOn(pingHelpers, 'measurePingWithinLimits').mockResolvedValue(50);
            await locationsService.setLocations([new Location(testLocation)]);
            type ActiveProfileSettings = ReturnType<typeof profilesService.getActiveProfileSettings>;
            vi.mocked(profilesService.getActiveProfileSettings)
                .mockReturnValue({ selectedLocation: null } as ActiveProfileSettings);
            type ProfileSettings = ReturnType<typeof profilesService.getProfileSettings>;
            vi.mocked(profilesService.getProfileSettings).mockReturnValue(
                { quickConnect: QuickConnectSetting.SpecificLocation } as ProfileSettings,
            );
            vi.clearAllMocks();
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should call updateProfileSettings with the specified profileId', async () => {
            await locationsService.setSelectedLocation('custom-profile', 'loc-berlin');

            expect(profilesService.updateProfileSettings).toHaveBeenCalledWith(
                'custom-profile',
                expect.objectContaining({ selectedLocation: expect.objectContaining({ id: 'loc-berlin' }) }),
                expect.any(Function),
            );
        });

        it('should emit PROFILE_LOCATION_UPDATED notification', async () => {
            const notifierSpy = vi.spyOn(notifier, 'notifyListeners');

            await locationsService.setSelectedLocation('custom-profile', 'loc-berlin');

            expect(notifierSpy).toHaveBeenCalledWith(
                notifier.types.PROFILE_LOCATION_UPDATED,
                'custom-profile',
                expect.objectContaining({ id: 'loc-berlin' }),
            );
        });

        it('should keep the current location when location id is not found', async () => {
            // The locations list may be not loaded yet: the profile location
            // must not be cleared in this case.
            await locationsService.setSelectedLocation('default', 'loc-berlin', { persistToProfile: false });
            vi.mocked(profilesService.updateProfileSettings).mockClear();

            await locationsService.setSelectedLocation('default', 'nonexistent-id');

            expect(profilesService.updateProfileSettings).not.toHaveBeenCalled();

            const selectedLocation = await locationsService.getSelectedLocation();
            expect(selectedLocation).toEqual(expect.objectContaining({ id: 'loc-berlin' }));
        });

        it('should report whether the location was applied', async () => {
            await expect(locationsService.setSelectedLocation('default', 'loc-berlin'))
                .resolves.toBe(true);
            await expect(locationsService.setSelectedLocation('default', 'nonexistent-id'))
                .resolves.toBe(false);
        });

        it('should persist the location for last used location profiles', async () => {
            type ProfileSettings = ReturnType<typeof profilesService.getProfileSettings>;
            vi.mocked(profilesService.getProfileSettings).mockReturnValue(
                { quickConnect: QuickConnectSetting.LastUsedLocation } as ProfileSettings,
            );

            // The popup saves the location without asking to persist it.
            await locationsService.setSelectedLocation(
                'custom-profile',
                'loc-berlin',
                { persistToProfile: false },
            );

            expect(profilesService.updateProfileSettings).toHaveBeenCalledWith(
                'custom-profile',
                expect.objectContaining({ selectedLocation: expect.objectContaining({ id: 'loc-berlin' }) }),
                expect.any(Function),
            );
        });

        it('should reconnect VPN when { reconnect: true } and VPN is connected', async () => {
            vi.mocked(profilesService.updateProfileSettings).mockImplementation(
                async (_id, _patch, onApply) => { if (onApply) await onApply(); },
            );
            vi.spyOn(connectivityService, 'isVPNDisconnectedIdle').mockReturnValue(false);
            vi.spyOn(connectivityService, 'isVPNIdle').mockReturnValue(false);

            await locationsService.setSelectedLocation('default', 'loc-berlin', { reconnect: true });

            expect(settings.disableProxy).toHaveBeenCalledWith(true);
            expect(settings.enableProxy).toHaveBeenCalledWith(true);
        });

        it('should not reconnect when { reconnect: true } but VPN is DisconnectedIdle', async () => {
            vi.mocked(profilesService.updateProfileSettings).mockImplementation(
                async (_id, _patch, onApply) => { if (onApply) await onApply(); },
            );
            vi.spyOn(connectivityService, 'isVPNDisconnectedIdle').mockReturnValue(true);
            vi.spyOn(connectivityService, 'isVPNIdle').mockReturnValue(false);

            await locationsService.setSelectedLocation('default', 'loc-berlin', { reconnect: true });

            expect(settings.disableProxy).not.toHaveBeenCalled();
            expect(settings.enableProxy).not.toHaveBeenCalled();
        });

        it('should not reconnect when { reconnect: true } but VPN is Idle', async () => {
            vi.mocked(profilesService.updateProfileSettings).mockImplementation(
                async (_id, _patch, onApply) => { if (onApply) await onApply(); },
            );
            vi.spyOn(connectivityService, 'isVPNDisconnectedIdle').mockReturnValue(false);
            vi.spyOn(connectivityService, 'isVPNIdle').mockReturnValue(true);

            await locationsService.setSelectedLocation('default', 'loc-berlin', { reconnect: true });

            expect(settings.disableProxy).not.toHaveBeenCalled();
            expect(settings.enableProxy).not.toHaveBeenCalled();
        });

        it('should not reconnect when reconnect option is not passed', async () => {
            vi.mocked(profilesService.updateProfileSettings).mockImplementation(
                async (_id, _patch, onApply) => { if (onApply) await onApply(); },
            );
            vi.spyOn(connectivityService, 'isVPNDisconnectedIdle').mockReturnValue(false);
            vi.spyOn(connectivityService, 'isVPNIdle').mockReturnValue(false);

            await locationsService.setSelectedLocation('default', 'loc-berlin');

            expect(settings.disableProxy).not.toHaveBeenCalled();
            expect(settings.enableProxy).not.toHaveBeenCalled();
        });

        it('should not persist to profile when persistToProfile is false', async () => {
            await locationsService.setSelectedLocation(
                'custom-profile',
                'loc-berlin',
                { persistToProfile: false },
            );

            expect(profilesService.updateProfileSettings).not.toHaveBeenCalled();
        });

        it('should still update locationsState when persistToProfile is false', async () => {
            await locationsService.setSelectedLocation(
                'custom-profile',
                'loc-berlin',
                { persistToProfile: false },
            );

            const selectedLocation = await locationsService.getSelectedLocation();
            expect(selectedLocation).toEqual(expect.objectContaining({ id: 'loc-berlin' }));
        });

        it('should reconnect when persistToProfile is false and reconnect is true', async () => {
            vi.spyOn(connectivityService, 'isVPNDisconnectedIdle').mockReturnValue(false);
            vi.spyOn(connectivityService, 'isVPNIdle').mockReturnValue(false);

            await locationsService.setSelectedLocation(
                'default',
                'loc-berlin',
                { reconnect: true, persistToProfile: false },
            );

            expect(settings.disableProxy).toHaveBeenCalledWith(true);
            expect(settings.enableProxy).toHaveBeenCalledWith(true);
            expect(profilesService.updateProfileSettings).not.toHaveBeenCalled();
        });

        it('should not emit PROFILE_LOCATION_UPDATED when persistToProfile is false', async () => {
            const notifierSpy = vi.spyOn(notifier, 'notifyListeners');

            await locationsService.setSelectedLocation(
                'custom-profile',
                'loc-berlin',
                { persistToProfile: false },
            );

            expect(notifierSpy).not.toHaveBeenCalledWith(
                notifier.types.PROFILE_LOCATION_UPDATED,
                expect.anything(),
                expect.anything(),
            );
        });
    });

    describe('displayed location from the popup', () => {
        const makeEndpoint = (domain: string): EndpointInterface => ({
            id: domain,
            domainName: domain,
            ipv4Address: '1.2.3.4',
            ipv6Address: '::1',
            publicKey: 'testkey=',
        });

        const freeLocation: LocationInterface = {
            id: 'loc-berlin',
            cityName: 'Berlin',
            countryName: 'Germany',
            countryCode: 'DE',
            coordinates: [13.4, 52.52],
            premiumOnly: false,
            pingBonus: 0,
            endpoints: [makeEndpoint('de.endpoint.test')],
            virtual: false,
        };

        const premiumLocation: LocationInterface = {
            ...freeLocation,
            id: 'loc-premium',
            cityName: 'Premium',
            premiumOnly: true,
        };

        beforeEach(async () => {
            vi.spyOn(pingHelpers, 'measurePingWithinLimits').mockResolvedValue(50);
            await locationsService.setLocations([
                new Location(freeLocation),
                new Location(premiumLocation),
            ]);
            vi.mocked(profilesService.getActiveProfileId).mockReturnValue('default');
            type ProfileSettings = ReturnType<typeof profilesService.getProfileSettings>;
            vi.mocked(profilesService.getProfileSettings).mockReturnValue(
                { quickConnect: QuickConnectSetting.SpecificLocation } as ProfileSettings,
            );
            vi.spyOn(credentials, 'isPremiumToken').mockResolvedValue(true);
            // Clear the one-shot flag left by the previous tests.
            locationsService.consumeDisplayedLocation();
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should apply the displayed location', async () => {
            const applied = await locationsService.applyDisplayedLocation({
                locationId: 'loc-berlin',
                profileId: 'default',
            });

            expect(applied).toBe(true);

            const selectedLocation = await locationsService.getSelectedLocation();
            expect(selectedLocation).toEqual(expect.objectContaining({ id: 'loc-berlin' }));
        });

        it('should consume the displayed location only once', async () => {
            await locationsService.applyDisplayedLocation({
                locationId: 'loc-berlin',
                profileId: 'default',
            });

            expect(locationsService.consumeDisplayedLocation()).toBe(true);
            expect(locationsService.consumeDisplayedLocation()).toBe(false);
        });

        it('should ignore the displayed location of another profile', async () => {
            const applied = await locationsService.applyDisplayedLocation({
                locationId: 'loc-berlin',
                profileId: 'custom-profile',
            });

            expect(applied).toBe(false);
            expect(locationsService.consumeDisplayedLocation()).toBe(false);
        });

        it('should not persist the displayed location to the profile', async () => {
            vi.mocked(profilesService.updateProfileSettings).mockClear();

            await locationsService.applyDisplayedLocation({
                locationId: 'loc-berlin',
                profileId: 'default',
            });

            expect(profilesService.updateProfileSettings).not.toHaveBeenCalled();
        });

        it('should ignore the displayed location after the ttl', async () => {
            const now = Date.now();
            const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(now);

            await locationsService.applyDisplayedLocation({
                locationId: 'loc-berlin',
                profileId: 'default',
            });

            dateNowSpy.mockReturnValue(now + 30_000 + 1);

            expect(locationsService.consumeDisplayedLocation()).toBe(false);
        });

        it('should ignore an unknown displayed location', async () => {
            const applied = await locationsService.applyDisplayedLocation({
                locationId: 'loc-unknown',
                profileId: 'default',
            });

            expect(applied).toBe(false);
            expect(locationsService.consumeDisplayedLocation()).toBe(false);
        });

        it('should ignore a premium-only displayed location for a free user', async () => {
            vi.mocked(credentials.isPremiumToken).mockResolvedValue(false);

            const applied = await locationsService.applyDisplayedLocation({
                locationId: 'loc-premium',
                profileId: 'default',
            });

            expect(applied).toBe(false);
            expect(locationsService.consumeDisplayedLocation()).toBe(false);
        });
    });

    describe('fastest location display sync', () => {
        const makeEndpoint = (domain: string): EndpointInterface => ({
            id: domain,
            domainName: domain,
            ipv4Address: '1.2.3.4',
            ipv6Address: '::1',
            publicKey: 'testkey=',
        });

        const makeLocation = (id: string, ping: number): LocationInterface => ({
            id,
            cityName: id,
            countryName: id,
            countryCode: id.toUpperCase(),
            coordinates: [13.4, 52.52],
            premiumOnly: false,
            pingBonus: 0,
            endpoints: [makeEndpoint(`${id}.endpoint.test`)],
            ping,
            virtual: false,
        });

        beforeEach(() => {
            type ActiveProfileSettings = ReturnType<typeof profilesService.getActiveProfileSettings>;
            vi.mocked(profilesService.getActiveProfileSettings).mockReturnValue({
                selectedLocation: null,
                quickConnect: QuickConnectSetting.FastestLocation,
            } as ActiveProfileSettings);
            vi.spyOn(credentials, 'isPremiumToken').mockResolvedValue(true);
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should notify the fastest location after pings are measured', async () => {
            const notifySpy = vi.spyOn(notifier, 'notifyListeners');

            await locationsService.setLocations([
                new Location(makeLocation('loc-slow', 200)),
                new Location(makeLocation('loc-fast', 50)),
            ]);

            expect(notifySpy).toHaveBeenCalledWith(
                notifier.types.CURRENT_LOCATION_UPDATED,
                expect.objectContaining({ id: 'loc-fast' }),
            );
        });

        it('should not override a location picked by the user', async () => {
            const notifySpy = vi.spyOn(notifier, 'notifyListeners');
            const slowLocation = makeLocation('loc-slow', 200);
            const fastLocation = makeLocation('loc-fast', 50);

            await locationsService.setLocations([
                new Location(slowLocation),
                new Location(fastLocation),
            ]);
            await locationsService.setSelectedLocation('default', 'loc-slow', {
                persistToProfile: false,
                isUserPick: true,
            });
            notifySpy.mockClear();

            await locationsService.setLocations([
                new Location(slowLocation),
                new Location(fastLocation),
            ]);

            expect(notifySpy).not.toHaveBeenCalledWith(
                notifier.types.CURRENT_LOCATION_UPDATED,
                expect.anything(),
            );
        });

        it('should not change the displayed location while the VPN is connected', async () => {
            vi.spyOn(connectivityService, 'isVPNIdle').mockReturnValue(false);
            vi.spyOn(connectivityService, 'isVPNDisconnectedIdle').mockReturnValue(false);
            const notifySpy = vi.spyOn(notifier, 'notifyListeners');

            await locationsService.setLocations([
                new Location(makeLocation('loc-slow', 200)),
                new Location(makeLocation('loc-fast', 50)),
            ]);

            expect(notifySpy).not.toHaveBeenCalledWith(
                notifier.types.CURRENT_LOCATION_UPDATED,
                expect.anything(),
            );
        });

        it('should replace a picked location that is no longer offered', async () => {
            const slowLocation = makeLocation('loc-slow', 200);
            const fastLocation = makeLocation('loc-fast', 50);

            await locationsService.setLocations([
                new Location(slowLocation),
                new Location(fastLocation),
            ]);
            await locationsService.setSelectedLocation('default', 'loc-slow', {
                persistToProfile: false,
                isUserPick: true,
            });

            // The backend removed the picked location.
            await locationsService.setLocations([new Location(fastLocation)]);

            const selectedLocation = await locationsService.getSelectedLocation();
            expect(selectedLocation).toEqual(expect.objectContaining({ id: 'loc-fast' }));
        });

        it('should replace a picked location that became premium-only', async () => {
            const premiumLocation = {
                ...makeLocation('loc-premium', 10),
                premiumOnly: true,
            };
            const freeLocation = makeLocation('loc-free', 50);

            await locationsService.setLocations([
                new Location(premiumLocation),
                new Location(freeLocation),
            ]);
            await locationsService.setSelectedLocation('default', 'loc-premium', {
                persistToProfile: false,
                isUserPick: true,
            });

            // The user downgraded: the picked location is no longer available.
            vi.mocked(credentials.isPremiumToken).mockResolvedValue(false);

            await locationsService.setLocations([
                new Location(premiumLocation),
                new Location(freeLocation),
            ]);

            const selectedLocation = await locationsService.getSelectedLocation();
            expect(selectedLocation).toEqual(expect.objectContaining({ id: 'loc-free' }));
        });
    });

    describe('applyProfileLocation', () => {
        const pinnedLocation: LocationInterface = {
            id: 'loc-berlin',
            cityName: 'Berlin',
            countryName: 'Germany',
            countryCode: 'DE',
            coordinates: [13.4, 52.52],
            premiumOnly: false,
            pingBonus: 0,
            endpoints: [],
            virtual: false,
        };

        beforeEach(() => {
            type ActiveProfileSettings = ReturnType<typeof profilesService.getActiveProfileSettings>;
            vi.mocked(profilesService.getActiveProfileSettings)
                .mockReturnValue({ selectedLocation: null } as ActiveProfileSettings);
            vi.mocked(profilesService.getProfileSettings).mockReturnValue({
                ...DEFAULT_PROFILE_SETTINGS,
                selectedLocation: null,
                quickConnect: QuickConnectSetting.LastUsedLocation,
            });
            vi.spyOn(credentials, 'isPremiumToken').mockResolvedValue(true);
        });

        it('should apply the pinned location of the profile', async () => {
            vi.mocked(profilesService.getProfileSettings).mockReturnValue({
                ...DEFAULT_PROFILE_SETTINGS,
                selectedLocation: pinnedLocation,
                quickConnect: QuickConnectSetting.SpecificLocation,
            });

            await locationsService.applyProfileLocation('profile-1');

            const selectedLocation = await locationsService.getSelectedLocation();
            expect(selectedLocation).toEqual(expect.objectContaining({ id: 'loc-berlin' }));
        });

        it('should keep the current location for last used profiles', async () => {
            // The location the user is connected to is kept: the stored
            // location is only used after a browser restart.
            await locationsService.setSelectedLocation(
                'default',
                'loc-berlin',
                { persistToProfile: false },
            );
            vi.mocked(profilesService.getProfileSettings).mockReturnValue({
                ...DEFAULT_PROFILE_SETTINGS,
                selectedLocation: { ...pinnedLocation, id: 'loc-stored', cityName: 'Stored' },
                quickConnect: QuickConnectSetting.LastUsedLocation,
            });

            await locationsService.applyProfileLocation('profile-1');

            const selectedLocation = await locationsService.getSelectedLocation();
            expect(selectedLocation).toEqual(expect.objectContaining({ id: 'loc-berlin' }));
        });

        it('should apply the fastest location for fastest location profiles', async () => {
            vi.spyOn(pingHelpers, 'measurePingWithinLimits').mockResolvedValue(50);
            const slowLocation: LocationInterface = {
                ...pinnedLocation,
                id: 'loc-slow',
                cityName: 'Slow',
                ping: 200,
            };
            const fastLocation: LocationInterface = {
                ...pinnedLocation,
                id: 'loc-fast',
                cityName: 'Fast',
                ping: 10,
            };
            await locationsService.setLocations([
                new Location(slowLocation),
                new Location(fastLocation),
            ]);
            vi.mocked(profilesService.getProfileSettings).mockReturnValue({
                ...DEFAULT_PROFILE_SETTINGS,
                selectedLocation: pinnedLocation,
                quickConnect: QuickConnectSetting.FastestLocation,
            });

            await locationsService.applyProfileLocation('profile-1');

            const selectedLocation = await locationsService.getSelectedLocation();
            expect(selectedLocation).toEqual(expect.objectContaining({ id: 'loc-fast' }));
        });

        it('should skip premium-only locations for free users', async () => {
            vi.spyOn(credentials, 'isPremiumToken').mockResolvedValue(false);
            vi.spyOn(pingHelpers, 'measurePingWithinLimits').mockResolvedValue(50);
            const premiumLocation: LocationInterface = {
                ...pinnedLocation,
                id: 'loc-premium',
                cityName: 'Premium',
                premiumOnly: true,
                ping: 10,
            };
            const freeLocation: LocationInterface = {
                ...pinnedLocation,
                id: 'loc-free',
                cityName: 'Free',
                premiumOnly: false,
                ping: 100,
            };
            await locationsService.setLocations([
                new Location(premiumLocation),
                new Location(freeLocation),
            ]);
            vi.mocked(profilesService.getProfileSettings).mockReturnValue({
                ...DEFAULT_PROFILE_SETTINGS,
                selectedLocation: null,
                quickConnect: QuickConnectSetting.FastestLocation,
            });

            await locationsService.applyProfileLocation('profile-1');

            const selectedLocation = await locationsService.getSelectedLocation();
            expect(selectedLocation).toEqual(expect.objectContaining({ id: 'loc-free' }));
        });

        it('should not keep the location of the previous profile when the fastest cannot be resolved', async () => {
            vi.spyOn(pingHelpers, 'measurePingWithinLimits').mockResolvedValue(50);
            await locationsService.setLocations([new Location(pinnedLocation)]);
            // The location is applied to the session directly: a strategy
            // different from the last used one skips the profile persistence.
            vi.mocked(profilesService.getProfileSettings).mockReturnValue({
                ...DEFAULT_PROFILE_SETTINGS,
                selectedLocation: null,
                quickConnect: QuickConnectSetting.SpecificLocation,
            });
            await locationsService.setSelectedLocation(
                'default',
                'loc-berlin',
                { persistToProfile: false },
            );
            vi.mocked(profilesService.getProfileSettings).mockReturnValue({
                ...DEFAULT_PROFILE_SETTINGS,
                selectedLocation: null,
                quickConnect: QuickConnectSetting.FastestLocation,
            });

            // The locations list is empty right after the extension restart.
            await locationsService.setLocations([]);

            await locationsService.applyProfileLocation('profile-1');

            const selectedLocation = await locationsService.getSelectedLocation();
            expect(selectedLocation).toBeNull();
        });

        it('should select the fastest location and store it when nothing is selected yet', async () => {
            vi.mocked(profilesService.getActiveProfileId).mockReturnValue('default');
            vi.spyOn(pingHelpers, 'measurePingWithinLimits').mockResolvedValue(50);
            const fastLocation: LocationInterface = {
                ...pinnedLocation,
                id: 'loc-fast',
                cityName: 'Fast',
                ping: 10,
            };
            await locationsService.setLocations([new Location(fastLocation)]);

            const selectedLocation = await locationsService.selectFastestLocation();

            expect(selectedLocation).toEqual(expect.objectContaining({ id: 'loc-fast' }));
            expect(profilesService.updateProfileSettings).toHaveBeenCalledWith(
                'default',
                expect.objectContaining({
                    selectedLocation: expect.objectContaining({ id: 'loc-fast' }),
                }),
                expect.any(Function),
            );
        });

        it('should fall back to the profile location when the fastest location cannot be resolved', async () => {
            type ActiveProfileSettings = ReturnType<typeof profilesService.getActiveProfileSettings>;
            vi.mocked(profilesService.getActiveProfileSettings).mockReturnValue({
                selectedLocation: { ...pinnedLocation, id: 'loc-stored', cityName: 'Stored' },
            } as ActiveProfileSettings);
            vi.mocked(profilesService.updateProfileSettings).mockClear();
            // The locations list is empty right after the browser restart.
            await locationsService.setLocations([]);

            const selectedLocation = await locationsService.selectFastestLocation();

            expect(selectedLocation).toEqual(expect.objectContaining({ id: 'loc-stored' }));
            expect(profilesService.updateProfileSettings).not.toHaveBeenCalled();
        });

        it('should put the fallback location into the session selection', async () => {
            type ActiveProfileSettings = ReturnType<typeof profilesService.getActiveProfileSettings>;
            vi.mocked(profilesService.getActiveProfileSettings).mockReturnValue({
                selectedLocation: { ...pinnedLocation, id: 'loc-stored', cityName: 'Stored' },
                quickConnect: QuickConnectSetting.FastestLocation,
            } as ActiveProfileSettings);
            await locationsService.setLocations([]);

            const selectedLocation = await locationsService.selectFastestLocation();

            expect(selectedLocation).toEqual(expect.objectContaining({ id: 'loc-stored' }));
            // The session selection is kept in sync with the tunnel location.
            const sessionLocation = await locationsService.getSelectedLocation();
            expect(sessionLocation).toEqual(expect.objectContaining({ id: 'loc-stored' }));
        });

        it('should not fall back to a premium location for free users', async () => {
            type ActiveProfileSettings = ReturnType<typeof profilesService.getActiveProfileSettings>;
            vi.mocked(profilesService.getActiveProfileSettings).mockReturnValue({
                selectedLocation: { ...pinnedLocation, id: 'loc-premium', premiumOnly: true },
            } as ActiveProfileSettings);
            vi.mocked(credentials.isPremiumToken).mockResolvedValue(false);
            await locationsService.setLocations([]);

            const selectedLocation = await locationsService.selectFastestLocation();

            expect(selectedLocation).toBeNull();
        });

        it('should still fall back to a premium location for premium users', async () => {
            type ActiveProfileSettings = ReturnType<typeof profilesService.getActiveProfileSettings>;
            vi.mocked(profilesService.getActiveProfileSettings).mockReturnValue({
                selectedLocation: { ...pinnedLocation, id: 'loc-premium', premiumOnly: true },
            } as ActiveProfileSettings);
            vi.mocked(credentials.isPremiumToken).mockResolvedValue(true);
            await locationsService.setLocations([]);

            const selectedLocation = await locationsService.selectFastestLocation();

            expect(selectedLocation).toEqual(expect.objectContaining({ id: 'loc-premium' }));
        });

        it('should not apply a premium location for free users when the fastest cannot be resolved', async () => {
            vi.mocked(credentials.isPremiumToken).mockResolvedValue(false);
            vi.spyOn(pingHelpers, 'measurePingWithinLimits').mockResolvedValue(50);
            await locationsService.setLocations([new Location(pinnedLocation)]);
            // The location is applied to the session directly: a strategy
            // different from the last used one skips the profile persistence.
            vi.mocked(profilesService.getProfileSettings).mockReturnValue({
                ...DEFAULT_PROFILE_SETTINGS,
                selectedLocation: null,
                quickConnect: QuickConnectSetting.SpecificLocation,
            });
            await locationsService.setSelectedLocation(
                'default',
                'loc-berlin',
                { persistToProfile: false },
            );
            vi.mocked(profilesService.getProfileSettings).mockReturnValue({
                ...DEFAULT_PROFILE_SETTINGS,
                selectedLocation: { ...pinnedLocation, id: 'loc-premium', premiumOnly: true },
                quickConnect: QuickConnectSetting.FastestLocation,
            });

            // The locations list is empty right after the extension restart.
            await locationsService.setLocations([]);

            await locationsService.applyProfileLocation('profile-1');

            // Neither the premium stored location nor the location of the
            // previous profile is applied.
            const selectedLocation = await locationsService.getSelectedLocation();
            expect(selectedLocation).toBeNull();
        });

        it('should prefer the profile location over the session one when the fastest cannot be resolved', async () => {
            vi.spyOn(pingHelpers, 'measurePingWithinLimits').mockResolvedValue(50);
            await locationsService.setLocations([new Location(pinnedLocation)]);
            // The location is applied to the session directly: a strategy
            // different from the last used one skips the profile persistence.
            vi.mocked(profilesService.getProfileSettings).mockReturnValue({
                ...DEFAULT_PROFILE_SETTINGS,
                selectedLocation: null,
                quickConnect: QuickConnectSetting.SpecificLocation,
            });
            await locationsService.setSelectedLocation(
                'default',
                'loc-berlin',
                { persistToProfile: false },
            );
            vi.mocked(profilesService.getProfileSettings).mockReturnValue({
                ...DEFAULT_PROFILE_SETTINGS,
                selectedLocation: { ...pinnedLocation, id: 'loc-stored', cityName: 'Stored' },
                quickConnect: QuickConnectSetting.FastestLocation,
            });

            // The locations list is empty right after the extension restart.
            await locationsService.setLocations([]);

            await locationsService.applyProfileLocation('profile-1');

            const selectedLocation = await locationsService.getSelectedLocation();
            expect(selectedLocation).toEqual(expect.objectContaining({ id: 'loc-stored' }));
        });

        it('should store the session location in a last used profile', async () => {
            vi.spyOn(pingHelpers, 'measurePingWithinLimits').mockResolvedValue(50);
            await locationsService.setLocations([new Location(pinnedLocation)]);
            vi.mocked(profilesService.getProfileSettings).mockReturnValue({
                ...DEFAULT_PROFILE_SETTINGS,
                selectedLocation: null,
                quickConnect: QuickConnectSetting.SpecificLocation,
            });
            // The location is applied to the session directly: a strategy
            // different from the last used one skips the profile persistence.
            await locationsService.setSelectedLocation(
                'default',
                'loc-berlin',
                { persistToProfile: false },
            );
            vi.mocked(profilesService.getProfileSettings).mockReturnValue({
                ...DEFAULT_PROFILE_SETTINGS,
                selectedLocation: null,
                quickConnect: QuickConnectSetting.LastUsedLocation,
            });
            vi.mocked(profilesService.updateProfileSettings).mockClear();

            await locationsService.applyProfileLocation('profile-1');

            // New profiles default to the last used strategy without a location:
            // the session location is stored so the popup shows the same location
            // as the tunnel after a browser restart.
            expect(profilesService.updateProfileSettings).toHaveBeenCalledWith(
                'profile-1',
                expect.objectContaining({
                    selectedLocation: expect.objectContaining({ id: 'loc-berlin' }),
                }),
            );
            const selectedLocation = await locationsService.getSelectedLocation();
            expect(selectedLocation).toEqual(expect.objectContaining({ id: 'loc-berlin' }));
        });

        it('should apply a premium pinned location for free users so the downgrade branch can move it', async () => {
            vi.mocked(credentials.isPremiumToken).mockResolvedValue(false);
            vi.mocked(profilesService.getProfileSettings).mockReturnValue({
                ...DEFAULT_PROFILE_SETTINGS,
                selectedLocation: { ...pinnedLocation, premiumOnly: true },
                quickConnect: QuickConnectSetting.SpecificLocation,
            });

            await locationsService.applyProfileLocation('profile-1');

            // The location is not filtered out: the downgrade branch in
            // Endpoints.updateLocations() moves it to the closest available one.
            const selectedLocation = await locationsService.getSelectedLocation();
            expect(selectedLocation).toEqual(expect.objectContaining({ id: 'loc-berlin', premiumOnly: true }));
        });

        it('should return a stored premium location of a free user', async () => {
            type ActiveProfileSettings = ReturnType<typeof profilesService.getActiveProfileSettings>;
            vi.mocked(credentials.isPremiumToken).mockResolvedValue(false);
            vi.mocked(profilesService.getActiveProfileSettings).mockReturnValue({
                selectedLocation: { ...pinnedLocation, premiumOnly: true },
                quickConnect: QuickConnectSetting.SpecificLocation,
            } as ActiveProfileSettings);

            const selectedLocation = await locationsService.getSelectedLocation();

            // A null here makes the callers resolve the fastest location and
            // overwrite the pinned one in the profile.
            expect(selectedLocation).toEqual(expect.objectContaining({ id: 'loc-berlin', premiumOnly: true }));
        });
    });

    describe('fastest location ping wait (AG-60345)', () => {
        const makeEndpoint = (domain: string): EndpointInterface => ({
            id: domain,
            domainName: domain,
            ipv4Address: '1.2.3.4',
            ipv6Address: '::1',
            publicKey: 'testkey=',
        });

        // Unique ids per test: the state storage and the pings cache are
        // module-level singletons shared by the whole file.
        const baseLocation: LocationInterface = {
            id: 'loc-ag60345-wait',
            cityName: 'Berlin',
            countryName: 'Germany',
            countryCode: 'DE',
            coordinates: [13.4, 52.52],
            premiumOnly: false,
            pingBonus: 0,
            endpoints: [makeEndpoint('loc-ag60345-wait.endpoint.test')],
            virtual: false,
        };

        let pendingSetLocations: Promise<void>;
        let waitLocationIndex = 0;
        let measuringLocationId = '';
        let pingedLocationId = '';

        beforeEach(async () => {
            waitLocationIndex += 1;
            measuringLocationId = `${baseLocation.id}-measuring-${waitLocationIndex}`;
            pingedLocationId = `${baseLocation.id}-pinged-${waitLocationIndex}`;

            type ActiveProfileSettings = ReturnType<typeof profilesService.getActiveProfileSettings>;
            vi.mocked(profilesService.getActiveProfileSettings).mockReturnValue({
                selectedLocation: null,
                quickConnect: QuickConnectSetting.FastestLocation,
            } as ActiveProfileSettings);
            // The previous describe restores all mocks, so re-establish the
            // profile mocks required by the persist path.
            type ProfileSettings = ReturnType<typeof profilesService.getProfileSettings>;
            vi.mocked(profilesService.getActiveProfileId).mockReturnValue('default');
            vi.mocked(profilesService.getProfileSettings).mockReturnValue({
                selectedLocation: null,
                quickConnect: QuickConnectSetting.FastestLocation,
            } as ProfileSettings);
            vi.mocked(profilesService.updateProfileSettings).mockImplementation(
                async (_id: string, _patch: unknown, onApply?: () => Promise<void>) => {
                    if (onApply) {
                        await onApply();
                    }
                },
            );
            vi.spyOn(credentials, 'isPremiumToken').mockResolvedValue(true);
            // Simulate the ping measurement window the popup races with on a
            // real backend without backend-provided pings: the first location
            // never finishes measuring, the second one is already pinged.
            vi.spyOn(pingHelpers, 'measurePingWithinLimits').mockReturnValue(new Promise<number>(() => {}));
            pendingSetLocations = locationsService.setLocations([
                new Location({ ...baseLocation, id: measuringLocationId }),
                new Location({ ...baseLocation, id: pingedLocationId, ping: 10 }),
            ]);

            // Wait until the locations are stored, the measurement is running
            // and the pinged location is available for ranking.
            await vi.waitFor(async () => {
                // @ts-ignore - access the private state to wait for the measurement
                const state = await locationsService.locationsState.get();
                expect(state.locations[0]?.id).toBe(measuringLocationId);
                expect(state.locations[0]?.available).toBe(true);
                expect(state.locations[0]?.ping).toBeNull();
                expect(locationsService.isMeasuring).toBe(true);
                expect(state.locations[1]?.ping).toBe(10);
            });
        });

        afterEach(() => {
            locationsService.isMeasuring = false;
            vi.useRealTimers();
            // The measurement never settles in these tests; swallow the
            // dangling rejection to keep the test output clean.
            pendingSetLocations.catch(() => {});
            vi.restoreAllMocks();
        });

        it('should wait for in-flight ping measurements by default', async () => {
            const sleepSpy = vi.spyOn(helpers, 'sleep');
            vi.useFakeTimers();
            try {
                const resolution = locationsService.resolveFastestLocation();
                await vi.advanceTimersByTimeAsync(1100);
                await resolution;

                expect(sleepSpy).toHaveBeenCalledWith(1000);
            } finally {
                vi.useRealTimers();
            }
        });

        it('should not wait for pings when waitForPings is false', async () => {
            const sleepSpy = vi.spyOn(helpers, 'sleep');

            const fastestLocation = await locationsService.resolveFastestLocation({ waitForPings: false });

            expect(sleepSpy).not.toHaveBeenCalled();
            expect(fastestLocation).toEqual(expect.objectContaining({ id: pingedLocationId, ping: 10 }));
        });

        it('should forward waitForPings from selectFastestLocation', async () => {
            const sleepSpy = vi.spyOn(helpers, 'sleep');

            const selectedLocation = await locationsService.selectFastestLocation({ waitForPings: false });

            expect(sleepSpy).not.toHaveBeenCalled();
            expect(selectedLocation).toEqual(expect.objectContaining({ id: pingedLocationId }));
        });

        it('should resolve for display without waiting and without persisting (popup path)', async () => {
            const sleepSpy = vi.spyOn(helpers, 'sleep');
            const sessionBefore = await locationsService.getSelectedLocation();
            vi.mocked(profilesService.updateProfileSettings).mockClear();

            const selectedLocation = await endpoints.getSelectedLocation({ persist: false });

            expect(sleepSpy).not.toHaveBeenCalled();
            expect(selectedLocation).toEqual(expect.objectContaining({ id: pingedLocationId, ping: 10 }));
            expect(profilesService.updateProfileSettings).not.toHaveBeenCalled();
            expect(await locationsService.getSelectedLocation()).toEqual(sessionBefore);
        });

        it('should keep waiting for pings for the callers that store the pick', async () => {
            const sleepSpy = vi.spyOn(helpers, 'sleep');
            vi.useFakeTimers();
            try {
                const resolution = endpoints.getSelectedLocation();
                await vi.advanceTimersByTimeAsync(1100);
                const selectedLocation = await resolution;

                expect(sleepSpy).toHaveBeenCalledWith(1000);
                expect(selectedLocation).toEqual(expect.objectContaining({ id: pingedLocationId }));
            } finally {
                vi.useRealTimers();
            }
        });

        it('should resolve the fastest location on connect while the location is not picked by the user', async () => {
            await expect(locationsService.shouldResolveFastestLocation()).resolves.toBe(true);
        });

        it('should keep the user-picked location on connect', async () => {
            await locationsService.setSelectedLocation('default', pingedLocationId, {
                persistToProfile: false,
                isUserPick: true,
            });

            await expect(locationsService.shouldResolveFastestLocation()).resolves.toBe(false);
        });

        it('should keep the user-pick flag when the same location is re-applied (endpoint rotation)', async () => {
            await locationsService.setSelectedLocation('default', pingedLocationId, {
                persistToProfile: false,
                isUserPick: true,
            });

            // Endpoints.reconnectEndpoint re-applies the same location without options.
            await locationsService.setSelectedLocation('default', pingedLocationId);

            await expect(locationsService.shouldResolveFastestLocation()).resolves.toBe(false);
        });

        it('should clear the user-pick flag when another location is applied', async () => {
            await locationsService.setSelectedLocation('default', pingedLocationId, {
                persistToProfile: false,
                isUserPick: true,
            });

            await locationsService.setSelectedLocation('default', measuringLocationId);

            await expect(locationsService.shouldResolveFastestLocation()).resolves.toBe(true);
        });

        it('should resolve the fastest location when the picked location is gone from the list', async () => {
            await locationsService.setSelectedLocation('default', pingedLocationId, {
                persistToProfile: false,
                isUserPick: true,
            });
            // The backend no longer offers the picked location.
            await locationsService.setLocations([
                new Location({ ...baseLocation, id: measuringLocationId }),
            ]);

            await expect(locationsService.shouldResolveFastestLocation()).resolves.toBe(true);
        });

        it('should not return the picked location that is gone from the list', async () => {
            await locationsService.setSelectedLocation('default', pingedLocationId, {
                persistToProfile: false,
                isUserPick: true,
            });
            // The backend no longer offers the picked location, but offers another pinged one.
            const offeredLocationId = `${pingedLocationId}-offered`;
            await locationsService.setLocations([
                new Location({ ...baseLocation, id: measuringLocationId }),
                new Location({ ...baseLocation, id: offeredLocationId, ping: 10 }),
            ]);

            const resolvedLocation = await locationsService.selectFastestLocation({ waitForPings: false });

            expect(resolvedLocation).toEqual(expect.objectContaining({ id: offeredLocationId }));
        });

        it('should not overwrite the user-picked location when the fastest location is resolved', async () => {
            await locationsService.setSelectedLocation('default', measuringLocationId, {
                persistToProfile: false,
                isUserPick: true,
            });

            const resolvedLocation = await locationsService.selectFastestLocation({ waitForPings: false });

            expect(resolvedLocation).toEqual(expect.objectContaining({ id: measuringLocationId }));
            await expect(locationsService.shouldResolveFastestLocation()).resolves.toBe(false);
        });

        it('should show the location picked by the user instead of the fastest one', async () => {
            vi.spyOn(connectivityService, 'isVPNIdle').mockReturnValue(true);
            const selectFastestLocationSpy = vi.spyOn(locationsService, 'selectFastestLocation');
            await locationsService.setSelectedLocation('default', measuringLocationId, {
                persistToProfile: false,
                isUserPick: true,
            });

            const selectedLocation = await endpoints.getSelectedLocation({ persist: false });

            expect(selectedLocation).toEqual(expect.objectContaining({ id: measuringLocationId }));
            // The display must not rank the locations again for the user's own pick.
            expect(selectFastestLocationSpy).not.toHaveBeenCalled();
        });

        it('should keep showing the current location when no ping is measured yet', async () => {
            vi.spyOn(connectivityService, 'isVPNIdle').mockReturnValue(true);
            // Only a location that is never pinged is available for ranking.
            await locationsService.setLocations([
                new Location({ ...baseLocation, id: measuringLocationId }),
            ]);
            await locationsService.setSelectedLocation('default', measuringLocationId);

            const selectedLocation = await endpoints.getSelectedLocation({ persist: false });

            expect(selectedLocation).toEqual(expect.objectContaining({ id: measuringLocationId }));
        });
    });

    describe('updateSelectedLocation profile guard', () => {
        const makeEndpoint = (domain: string): EndpointInterface => ({
            id: domain,
            domainName: domain,
            ipv4Address: '1.2.3.4',
            ipv6Address: '::1',
            publicKey: 'testkey=',
        });

        const berlinLocation: LocationInterface = {
            id: 'loc-berlin',
            cityName: 'Berlin',
            countryName: 'Germany',
            countryCode: 'DE',
            coordinates: [13.4, 52.52],
            premiumOnly: false,
            pingBonus: 0,
            endpoints: [makeEndpoint('de.endpoint.test')],
            virtual: false,
        };

        const tokyoLocation: LocationInterface = {
            id: 'loc-tokyo',
            cityName: 'Tokyo',
            countryName: 'Japan',
            countryCode: 'JP',
            coordinates: [139.69, 35.69],
            premiumOnly: false,
            pingBonus: 0,
            endpoints: [makeEndpoint('jp.endpoint.test')],
            virtual: false,
        };

        beforeEach(async () => {
            vi.spyOn(pingHelpers, 'measurePingWithinLimits').mockResolvedValue(50);
            await locationsService.setLocations([
                new Location(berlinLocation),
                new Location(tokyoLocation),
            ]);
            type ActiveProfileSettings = ReturnType<typeof profilesService.getActiveProfileSettings>;
            vi.mocked(profilesService.getActiveProfileSettings)
                .mockReturnValue({ selectedLocation: null } as ActiveProfileSettings);
            type ProfileSettings = ReturnType<typeof profilesService.getProfileSettings>;
            vi.mocked(profilesService.getProfileSettings).mockReturnValue(
                { quickConnect: QuickConnectSetting.SpecificLocation } as ProfileSettings,
            );
            vi.clearAllMocks();
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should persist to profile when session location matches profile location', async () => {
            // Profile stores Berlin, session also has Berlin selected
            vi.mocked(profilesService.getActiveProfileSettings).mockReturnValue(
                { selectedLocation: berlinLocation } as ReturnType<typeof profilesService.getActiveProfileSettings>,
            );
            vi.mocked(profilesService.getActiveProfileId).mockReturnValue('default');

            // Select Berlin in session so updateSelectedLocation finds it
            await locationsService.setSelectedLocation('default', 'loc-berlin', { persistToProfile: false });
            vi.mocked(profilesService.updateProfileSettings).mockClear();

            await locationsService.updateSelectedLocation();

            expect(profilesService.updateProfileSettings).toHaveBeenCalledWith(
                'default',
                expect.objectContaining({
                    selectedLocation: expect.objectContaining({ id: 'loc-berlin' }),
                }),
            );
        });

        it('should NOT persist to profile when session location differs and profile location exists', async () => {
            // Profile stores Berlin, but popup changed session to Tokyo.
            // Berlin still exists in the available locations list,
            // so the profile should NOT be overwritten.
            vi.mocked(profilesService.getActiveProfileSettings).mockReturnValue(
                { selectedLocation: berlinLocation } as ReturnType<typeof profilesService.getActiveProfileSettings>,
            );
            vi.mocked(profilesService.getActiveProfileId).mockReturnValue('default');

            // Session has Tokyo (popup override)
            await locationsService.setSelectedLocation('default', 'loc-tokyo', { persistToProfile: false });
            vi.mocked(profilesService.updateProfileSettings).mockClear();

            await locationsService.updateSelectedLocation();

            expect(profilesService.updateProfileSettings).not.toHaveBeenCalled();
        });

        it('should persist to profile when the profile follows the last used location', async () => {
            // The location picked in the popup becomes the last used location
            // of the profile, so it survives the extension restart.
            vi.mocked(profilesService.getActiveProfileSettings).mockReturnValue(
                {
                    selectedLocation: berlinLocation,
                    quickConnect: QuickConnectSetting.LastUsedLocation,
                } as ReturnType<typeof profilesService.getActiveProfileSettings>,
            );
            vi.mocked(profilesService.getActiveProfileId).mockReturnValue('default');

            await locationsService.setSelectedLocation('default', 'loc-tokyo', { persistToProfile: false });
            vi.mocked(profilesService.updateProfileSettings).mockClear();

            await locationsService.updateSelectedLocation();

            expect(profilesService.updateProfileSettings).toHaveBeenCalledWith(
                'default',
                expect.objectContaining({
                    selectedLocation: expect.objectContaining({ id: 'loc-tokyo' }),
                }),
            );
        });

        it('should persist to profile when profile location no longer exists in available list', async () => {
            // Profile stores a location that was removed from the server.
            const removedLocation: LocationInterface = {
                id: 'loc-removed',
                cityName: 'Removed',
                countryName: 'Nowhere',
                countryCode: 'XX',
                coordinates: [0, 0],
                premiumOnly: false,
                pingBonus: 0,
                endpoints: [makeEndpoint('removed.endpoint.test')],
                virtual: false,
            };

            vi.mocked(profilesService.getActiveProfileSettings).mockReturnValue(
                { selectedLocation: removedLocation } as ReturnType<typeof profilesService.getActiveProfileSettings>,
            );
            vi.mocked(profilesService.getActiveProfileId).mockReturnValue('default');

            await locationsService.setSelectedLocation('default', 'loc-tokyo', { persistToProfile: false });
            vi.mocked(profilesService.updateProfileSettings).mockClear();

            await locationsService.updateSelectedLocation();

            expect(profilesService.updateProfileSettings).toHaveBeenCalledWith(
                'default',
                expect.objectContaining({
                    selectedLocation: expect.objectContaining({ id: 'loc-tokyo' }),
                }),
            );
        });
    });
});
