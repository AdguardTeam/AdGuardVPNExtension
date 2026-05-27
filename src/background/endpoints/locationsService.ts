import isEmpty from 'lodash/isEmpty';

import { log } from '../../common/logger';
import { measurePingWithinLimits } from '../connectivity/pingHelpers';
import { notifier } from '../../common/notifier';
import { vpnProvider } from '../providers/vpnProvider';
import {
    type LocationInterface,
    type EndpointInterface,
    type PingsCacheInterface,
    StorageKey,
} from '../schema';
import { StateData } from '../stateStorage';
import { type StorageInterface } from '../browserApi/storage';
import { browserApi } from '../browserApi';
import { profilesService } from '../profiles';
import { connectivityService } from '../connectivity/connectivityService';
import { settings } from '../settings';

import { Location } from './Location';
import { LocationWithPing } from './LocationWithPing';
import { LocationsTab } from './locationsEnums';

export interface PingData {
    ping: number | null;
    available: boolean;
    lastMeasurementTime: number;
    endpoint: EndpointInterface | null;
    isMeasuring: boolean;
}

interface IncomingPingData {
    ping?: number | null;
    available?: boolean;
    lastMeasurementTime?: number;
    endpoint?: EndpointInterface | null;
    isMeasuring?: boolean;
}

interface LocationsServiceInterface {
    getLocationsFromServer(appId: string, vpnToken: string): Promise<Location[]>;
    updateSelectedLocation(): Promise<LocationInterface | null>;
    getEndpointByLocation(
        location: LocationInterface,
        forcePrevEndpoint?: boolean,
    ): Promise<EndpointInterface | null>;
    getLocationByEndpoint(endpointId: string): Promise<LocationInterface | null>;
    getLocationsWithPing(): Promise<LocationWithPing[]>;
    setSelectedLocation(
        profileId: string,
        id: string,
        options?: { reconnect?: boolean; persistToProfile?: boolean },
    ): Promise<void>;
    getSelectedLocation(): Promise<LocationInterface | null>;
    getLocations(): Promise<LocationInterface[]>;
    getEndpoint(
        location: LocationInterface,
        forcePrevEndpoint: boolean,
    ): Promise<EndpointInterface | null>;

    /**
     * Retrieves locations tab from local storage.
     * If it doesn't exist or corrupted - sets default value.
     *
     * @returns Locations tab.
     */
    getLocationsTab(): Promise<LocationsTab>;

    /**
     * Sets locations tab in local storage.
     *
     * @param locationsTab New locations tab.
     */
    saveLocationsTab(locationsTab: LocationsTab): Promise<void>;
}

/**
 * Constructor parameters for {@link LocationsService}.
 */
export interface LocationsServiceParameters {
    /**
     * Browser local storage.
     */
    storage: StorageInterface;
}

export class LocationsService implements LocationsServiceInterface {
    /**
     * Key for saved locations in local storage.
     */
    private static readonly LOCATIONS_TAB_KEY = 'locations.tab';

    /**
     * Default locations tab after installation.
     */
    private static readonly DEFAULT_LOCATIONS_TAB = LocationsTab.All;

    /**
     * Browser local storage.
     */
    private storage: StorageInterface;

    /**
     * Cached locations tab.
     *
     * Lazy-loaded in {@link getLocationsTab} method.
     */
    private locationsTab: LocationsTab | null = null;

    /**
     * Locations service state data.
     * Used to save and retrieve locations state from session storage,
     * in order to persist it across service worker restarts.
     */
    private locationsState = new StateData(StorageKey.LocationsService);

    private readonly PING_TTL_MS = 1000 * 60 * 10; // 10 minutes

    /**
     * Reconnects the VPN tunnel if it is currently active
     * (not idle and not disconnected-idle).
     */
    private reconnectIfVpnActive = async (): Promise<void> => {
        if (!connectivityService.isVPNDisconnectedIdle()
            && !connectivityService.isVPNIdle()) {
            await settings.disableProxy(true);
            await settings.enableProxy(true);
        }
    };

    /**
     * Constructor.
     */
    constructor({
        storage,
    }: LocationsServiceParameters) {
        this.storage = storage;
    }

    /**
     * Gets all available VPN location instances.
     *
     * @returns Locations instances.
     */
    public getLocations = async (): Promise<LocationInterface[]> => {
        const { locations } = await this.locationsState.get();
        return locations;
    };

    public getPingFromCache = async (id: string): Promise<{ locationId: string } & PingsCacheInterface[string]> => {
        const { pingsCache } = await this.locationsState.get();
        return {
            locationId: id,
            ...pingsCache[id],
        };
    };

    /**
     * Sets location available state
     * @param location
     * @param state
     */
    private setLocationAvailableState = (location: LocationInterface, state: boolean): void => {
        // eslint-disable-next-line no-param-reassign
        location.available = state;
    };

    /**
     * Sets location ping
     * @param location
     * @param ping
     */
    private setLocationPing = (location: LocationInterface, ping: number | null): void => {
        // eslint-disable-next-line no-param-reassign
        location.ping = ping;
    };

    /**
     * Sets location endpoint
     * @param location
     * @param endpoint
     */
    private setLocationEndpoint = (
        location: LocationInterface,
        endpoint: EndpointInterface | null,
    ): void => {
        if (!endpoint) {
            return;
        }
        // eslint-disable-next-line no-param-reassign
        location.endpoint = endpoint;
    };

    /**
     * Gets locations enriched with ping for UI.
     *
     * @returns Locations with pings, used for UI.
     */
    public getLocationsWithPing = async (): Promise<LocationWithPing[]> => {
        const { locations } = await this.locationsState.get();

        return Promise.all(locations.map(async (location: LocationInterface) => {
            const cachedPingData = await this.getPingFromCache(location.id);
            if (cachedPingData) {
                this.setLocationPing(location, cachedPingData.ping);
                this.setLocationAvailableState(location, cachedPingData.available);
            }
            // after setting ping to location, it's type turns from LocationInterface to LocationWithPing
            return new LocationWithPing(location);
        }));
    };

    private updatePingsCache = async (id: string, newData: IncomingPingData): Promise<void> => {
        const { pingsCache } = await this.locationsState.get();

        const oldData = pingsCache[id];
        if (oldData) {
            pingsCache[id] = { ...oldData, ...newData };
        } else {
            pingsCache[id] = {
                ping: null,
                available: true,
                lastMeasurementTime: 0,
                endpoint: null,
                isMeasuring: true,
                ...newData,
            };
        }

        await this.locationsState.update({ pingsCache });
    };

    /**
     * Moves endpoint to the start of endpoints if found.
     * @param endpoints
     * @param endpoint
     *
     * @returns Endpoints array with the given endpoint moved to the first position, or the original order if not found.
     */
    private moveToTheStart = (
        endpoints: EndpointInterface[],
        endpoint: EndpointInterface,
    ): EndpointInterface[] => {
        const foundEndpoint = endpoints.find((e) => e.id === endpoint.id);
        let result = endpoints;
        if (foundEndpoint) {
            result = endpoints.filter((e) => e.id !== foundEndpoint.id);
            result.unshift(foundEndpoint);
        }
        return result;
    };

    /**
     * Measures pings to endpoints one by one, and returns first one available
     * If was unable to measure ping to all endpoints, returns first endpoint from the list.
     *
     * @param location
     * @param forcePrevEndpoint boolean flag to measure ping of previously
     *  selected endpoint only
     *
     *  @returns Promise with ping and endpoint.
     */
    private getEndpointAndPing = async (
        location: LocationInterface,
        forcePrevEndpoint = false,
    ): Promise<{ ping: number | null, endpoint: EndpointInterface | null }> => {
        let endpoint = null;
        let ping = null;
        let i = 0;

        if (forcePrevEndpoint && location.endpoint) {
            const { endpoint } = location;
            ping = await measurePingWithinLimits(endpoint.domainName);
            return {
                ping,
                endpoint,
            };
        }

        let endpoints = [...location.endpoints];

        /**
         * If previous endpoint was determined, we start calculating ping from it
         */
        if (location.endpoint) {
            endpoints = this.moveToTheStart(endpoints, location.endpoint);
        }

        while (!ping && endpoints[i]) {
            endpoint = endpoints[i];
            // eslint-disable-next-line no-await-in-loop
            ping = await measurePingWithinLimits(endpoint.domainName);
            i += 1;
        }

        /**
         * If no ping determined, return first value
         */
        if (!ping) {
            [endpoint] = endpoints;
        }

        return {
            ping,
            endpoint,
        };
    };

    /**
     * Determines ping for location and saves it in the pings cache
     * @param location location to measure ping for
     * @param force boolean flag to measure ping without checking pings ttl
     */
    private measurePing = async (location: LocationInterface, force: boolean): Promise<void> => {
        const { id } = location;
        const { pingsCache } = await this.locationsState.get();

        // Do not begin pings measurement while it is measuring yet
        if (pingsCache[id]?.isMeasuring) {
            return;
        }

        const lastMeasurementTime = pingsCache[id]?.lastMeasurementTime;
        const isFresh = lastMeasurementTime
            ? !(Date.now() - lastMeasurementTime >= this.PING_TTL_MS)
            : false;

        const hasPing = (pingsCache[id]?.ping ?? null) !== null;

        if (isFresh && hasPing && !force) {
            return;
        }

        await this.updatePingsCache(location.id, { isMeasuring: true });

        const { ping, endpoint } = await this.getEndpointAndPing(location);

        this.setLocationPing(location, ping);
        const available = !!ping;
        this.setLocationAvailableState(location, available);

        await this.updatePingsCache(
            location.id,
            {
                available,
                ping,
                endpoint,
                isMeasuring: false,
                lastMeasurementTime: Date.now(),
            },
        );

        notifier.notifyListeners(
            notifier.types.LOCATION_STATE_UPDATED,
            await this.getPingFromCache(location.id),
        );
    };

    /**
     * Removes pings from the cache and locations.
     *
     * Needed for "Refresh pings" button in the "Locations" screen in popup.
     */
    private prunePings = async (): Promise<void> => {
        const { locations } = await this.locationsState.get();
        await Promise.all(locations.map(async (location) => {
            await this.updatePingsCache(location.id, { ping: null });
            // eslint-disable-next-line no-param-reassign
            location.ping = null;
        }));

        const locationsWithPings = await this.getLocationsWithPing();
        notifier.notifyListeners(
            notifier.types.LOCATIONS_UPDATED,
            locationsWithPings,
        );
    };

    /**
     * Flag used to control when it is possible to start pings measurement again
     */
    public isMeasuring = false;

    /**
     * Measures pings for all locations.
     *
     * @param force Flag indicating that pings should be measured without checking ttl
     */
    private measurePings = async (force = false): Promise<void> => {
        if (this.isMeasuring) {
            return;
        }

        this.isMeasuring = true;

        if (force) {
            await this.prunePings();
        }

        const { locations } = await this.locationsState.get();
        await Promise.all(locations.map((location) => {
            return this.measurePing(location, force);
        }));

        this.isMeasuring = false;
    };

    /**
     * Checks if ping measurement is currently in progress.
     *
     * @returns True if ping measurement is in progress.
     */
    public isMeasuringPingInProgress = (): boolean => {
        return this.isMeasuring;
    };

    /**
     * Actualizes selected location data.
     *
     * @returns selected location if it's endpoint was updated.
     */
    public updateSelectedLocation = async (): Promise<LocationInterface | null> => {
        const { selectedLocation, locations } = await this.locationsState.get();
        if (!selectedLocation) {
            return null;
        }

        const oldSelectedLocation = selectedLocation;
        const actualSelectedLocation = locations.find((location) => {
            return location.id === selectedLocation?.id;
        });

        const updatedSelectedLocation = actualSelectedLocation || oldSelectedLocation;
        await this.locationsState.update({ selectedLocation: updatedSelectedLocation });

        // Persist the session location to the active profile so that it stays
        // up-to-date with server-side changes (e.g. endpoint rotation) and is
        // available immediately after a browser restart.
        // Skip persistence when the profile stores a different location that
        // still exists — this means the popup changed the session location
        // without persisting, and we must not overwrite the profile choice.
        const activeProfileId = profilesService.getActiveProfileId();
        const activeSettings = profilesService.getActiveProfileSettings();
        const profileLocation = activeSettings.selectedLocation;

        const profileLocationMatchesSession = profileLocation?.id === updatedSelectedLocation?.id;
        const profileLocationExists = profileLocation
            && locations.some((location) => location.id === profileLocation.id);

        if (profileLocationMatchesSession || !profileLocationExists) {
            await profilesService.updateProfileSettings(
                activeProfileId,
                { selectedLocation: updatedSelectedLocation },
            );
        }

        if (oldSelectedLocation?.endpoint?.id && updatedSelectedLocation?.endpoint?.id
            && oldSelectedLocation.endpoint.id !== updatedSelectedLocation.endpoint.id) {
            return updatedSelectedLocation;
        }

        return null;
    };

    public setLocations = async (newLocations: LocationInterface[]): Promise<void> => {
        const { pingsCache } = await this.locationsState.get();

        // copy previous pings data for locations without a backend-provided ping
        const updatedNewLocations = newLocations.map((location: LocationInterface) => {
            const pingCache = pingsCache[location.id];
            // Backend may omit ping (undefined) or explicitly send null.
            if (pingCache && (location.ping === null || location.ping === undefined)) {
                this.setLocationPing(location, pingCache.ping);
                this.setLocationAvailableState(location, pingCache.available);
                this.setLocationEndpoint(location, pingCache.endpoint);
            }
            return location;
        });

        await this.locationsState.update({ locations: updatedNewLocations });

        // populate pings cache with backend-provided pings before measuring
        const lastMeasurementTime = Date.now();
        await Promise.all(updatedNewLocations.map(async (location: LocationInterface) => {
            if (location.ping !== null && location.ping !== undefined) {
                await this.updatePingsCache(location.id, {
                    ping: location.ping,
                    available: true,
                    lastMeasurementTime,
                    endpoint: null,
                    isMeasuring: false,
                });
            }
        }));

        // launch pings measurement
        await this.measurePings();

        notifier.notifyListeners(
            notifier.types.LOCATIONS_UPDATED,
            await this.getLocationsWithPing(),
        );
    };

    /**
     * Retrieves locations from server.
     *
     * @param appId
     * @param vpnToken
     *
     * @returns Locations from server.
     */
    public getLocationsFromServer = async (appId: string, vpnToken: string): Promise<Location[]> => {
        const locationsData = await vpnProvider.getLocationsData(appId, vpnToken);

        const locations = locationsData.map((locationData: LocationInterface) => {
            return new Location(locationData);
        });

        // During endpoint deployments, api can return empty list of locations
        // thus we continue to use locations from memory
        if (!isEmpty(locations)) {
            await this.setLocations(locations);
        } else {
            log.debug('[vpn.LocationsService]: Api returned empty list of locations', locations);
        }

        return locations;
    };

    /**
     * Gets the best available endpoint for a location by measuring ping.
     *
     * @param location Location to get endpoint for.
     * @param forcePrevEndpoint Force using previously selected endpoint.
     *
     * @returns Promise with available endpoint if found, or the first one.
     */
    public getEndpoint = async (
        location: LocationInterface,
        forcePrevEndpoint: boolean,
    ): Promise<EndpointInterface | null> => {
        if (!location) {
            return null;
        }

        const { ping, endpoint } = await this.getEndpointAndPing(location, forcePrevEndpoint);

        this.setLocationPing(location, ping);
        this.setLocationEndpoint(location, endpoint);
        const available = !!ping;
        this.setLocationAvailableState(location, available);

        await this.updatePingsCache(
            location.id,
            {
                available,
                ping,
                endpoint,
                lastMeasurementTime: Date.now(),
            },
        );

        notifier.notifyListeners(
            notifier.types.LOCATION_STATE_UPDATED,
            await this.getPingFromCache(location.id),
        );

        if (!available) {
            throw new Error('Was unable to determine ping for endpoint');
        }

        return endpoint;
    };

    /**
     * Gets endpoint for a specific location by its ID.
     *
     * @param location Location to get endpoint for.
     * @param forcePrevEndpoint Force using previously selected endpoint.
     *
     * @returns Promise with endpoint by location id.
     */
    public getEndpointByLocation = async (
        location: LocationInterface,
        forcePrevEndpoint: boolean = false,
    ): Promise<EndpointInterface | null> => {
        const { locations } = await this.locationsState.get();
        let targetLocation: LocationInterface | undefined = location;

        // This could be empty on extension restart, but after we try to use the most fresh data
        if (locations && locations.length > 0) {
            targetLocation = locations.find((l) => {
                return l.id === location.id;
            });
        }

        if (!targetLocation) {
            return null;
        }

        return this.getEndpoint(targetLocation, forcePrevEndpoint);
    };

    /**
     * Finds a location that contains the specified endpoint.
     *
     * @param endpointId Endpoint id.
     *
     * @returns Location by endpoint id.
     */
    public getLocationByEndpoint = async (endpointId: string): Promise<LocationInterface | null> => {
        if (!endpointId) {
            return null;
        }

        const { locations } = await this.locationsState.get();
        const location = locations.find((location) => {
            return location.endpoints.some((endpoint) => endpoint.id === endpointId);
        });

        return location || null;
    };

    /**
     * Updates the selected location in the session cache and optionally
     * persists it to the profile.
     * If the profile is currently active and VPN is connected or connecting,
     * triggers a reconnect to apply the new location.
     *
     * @param profileId Profile ID.
     * @param id Location id.
     * @param options Options for the location change.
     * @param options.reconnect Whether to reconnect VPN if the profile is active.
     * @param options.persistToProfile Whether to save the location to the profile settings.
     */
    public setSelectedLocation = async (
        profileId: string,
        id: string,
        { reconnect = false, persistToProfile = true }: { reconnect?: boolean; persistToProfile?: boolean } = {},
    ): Promise<void> => {
        const { locations } = await this.locationsState.get();
        const newSelectedLocation = locations.find((location) => location.id === id) || null;

        if (persistToProfile) {
            await profilesService.updateProfileSettings(
                profileId,
                { selectedLocation: newSelectedLocation },
                () => this.applySelectedLocation(newSelectedLocation, reconnect),
            );

            notifier.notifyListeners(
                notifier.types.PROFILE_LOCATION_UPDATED,
                profileId,
                newSelectedLocation,
            );
        } else {
            await this.applySelectedLocation(newSelectedLocation, reconnect);
        }

        notifier.notifyListeners(notifier.types.UPDATE_BROWSER_ACTION_ICON);
    };

    /**
     * Updates the session-cached selected location and optionally
     * reconnects the VPN tunnel.
     *
     * @param selectedLocation New selected location.
     * @param reconnect Whether to reconnect VPN.
     */
    private applySelectedLocation = async (
        selectedLocation: LocationInterface | null,
        reconnect: boolean,
    ): Promise<void> => {
        await this.locationsState.update({ selectedLocation });
        if (reconnect) {
            await this.reconnectIfVpnActive();
        }
    };

    /**
     * When we connect to the location there is no time to find better location.
     *
     * @returns Promise with null or selected location.
     */
    public getSelectedLocation = async (): Promise<LocationInterface | null> => {
        let { selectedLocation } = await this.locationsState.get();

        if (!selectedLocation) {
            const activeSettings = profilesService.getActiveProfileSettings();
            const { selectedLocation: storedLocation } = activeSettings;

            if (!storedLocation) {
                return null;
            }

            selectedLocation = new Location(storedLocation);
            await this.locationsState.update({ selectedLocation });
        }

        return selectedLocation;
    };

    /**
     * Updates the session-cached selected location from the given
     * profile and reconnects the VPN if it is currently connected and
     * the location has changed.
     *
     * @param profileId Profile to apply.
     */
    public applyActiveProfile = async (profileId: string): Promise<void> => {
        const activeSettings = profilesService.getProfileSettings(profileId);
        const { selectedLocation: storedLocation } = activeSettings;

        const newSelectedLocation = storedLocation
            ? new Location(storedLocation)
            : null;

        const { selectedLocation: previousLocation } = await this.locationsState.get();
        await this.locationsState.update({ selectedLocation: newSelectedLocation });

        const locationChanged = previousLocation?.id !== newSelectedLocation?.id;

        if (locationChanged) {
            await this.reconnectIfVpnActive();
            notifier.notifyListeners(notifier.types.CURRENT_LOCATION_UPDATED, newSelectedLocation);
        }

        notifier.notifyListeners(notifier.types.UPDATE_BROWSER_ACTION_ICON);
    };

    /**
     * Retrieves locations tab from local storage.
     * If it doesn't exist or corrupted - sets default value.
     *
     * @returns Promise with locations tab.
     */
    public getLocationsTab = async (): Promise<LocationsTab> => {
        // If already in memory - return it
        if (this.locationsTab) {
            return this.locationsTab;
        }

        let storageLocationsTab = await this.storage.get<LocationsTab>(LocationsService.LOCATIONS_TAB_KEY);

        // Sets default value if it doesn't exist or corrupted in local storage
        if (!storageLocationsTab || !Object.values(LocationsTab).includes(storageLocationsTab)) {
            storageLocationsTab = LocationsService.DEFAULT_LOCATIONS_TAB;
            await this.saveLocationsTab(storageLocationsTab);
        }

        // Save in memory and return
        this.locationsTab = storageLocationsTab;
        return this.locationsTab;
    };

    /**
     * Saves locations tab in local storage.
     *
     * @param locationsTab New locations tab.
     */
    public saveLocationsTab = async (locationsTab: LocationsTab): Promise<void> => {
        this.locationsTab = locationsTab;
        await this.storage.set(LocationsService.LOCATIONS_TAB_KEY, this.locationsTab);
    };
}

export const locationsService = new LocationsService({
    storage: browserApi.storage,
});
