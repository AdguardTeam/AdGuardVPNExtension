import isEmpty from 'lodash/isEmpty';

import { log } from '../../common/logger';
import { measurePingWithinLimits } from '../connectivity/pingHelpers';
import { notifier } from '../../common/notifier';
import { vpnProvider } from '../providers/vpnProvider';
import { SETTINGS_IDS } from '../../common/constants';
// eslint-disable-next-line import/no-cycle
import { settings } from '../settings';
import {
    type LocationInterface,
    type EndpointInterface,
    type LocationsServiceState,
    type PingsCacheInterface,
    StorageKey,
} from '../schema';
import { stateStorage } from '../stateStorage';
import { type StorageInterface } from '../browserApi/storage';
import { browserApi } from '../browserApi';

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
    getIsLocationSelectedByUser(): Promise<boolean>;
    getLocationsFromServer(appId: string, vpnToken: string): Promise<Location[]>;
    updateSelectedLocation(): LocationInterface | null;
    getEndpointByLocation(
        location: LocationInterface,
        forcePrevEndpoint?: boolean,
    ): Promise<EndpointInterface | null>;
    getLocationByEndpoint(endpointId: string): LocationInterface | null;
    getLocationsWithPing(): LocationWithPing[];
    setSelectedLocation(id: string, isLocationSelectedByUser?: boolean): Promise<void>;
    getSelectedLocation(): Promise<LocationInterface | null>;
    getLocations(): LocationInterface[];
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

    state: LocationsServiceState;

    PING_TTL_MS = 1000 * 60 * 10; // 10 minutes

    /**
     * Constructor.
     */
    constructor({
        storage,
    }: LocationsServiceParameters) {
        this.storage = storage;
    }

    public init() {
        this.state = stateStorage.getItem(StorageKey.LocationsService);
    }

    private saveLocationsServiceState = () => {
        stateStorage.setItem(StorageKey.LocationsService, this.state);
    };

    private get pingsCache(): PingsCacheInterface {
        return this.state.pingsCache;
    }

    private get locations(): LocationInterface[] {
        return this.state.locations;
    }

    private set locations(locations: LocationInterface[]) {
        this.state.locations = locations;
        this.saveLocationsServiceState();
    }

    private get selectedLocation(): LocationInterface | null {
        return this.state.selectedLocation;
    }

    private set selectedLocation(selectedLocation: LocationInterface | null) {
        this.state.selectedLocation = selectedLocation;
        this.saveLocationsServiceState();
    }

    /**
     * Returns locations instances
     */
    getLocations = (): LocationInterface[] => {
        return this.locations;
    };

    getPingFromCache = (id: string) => {
        return {
            locationId: id,
            ...this.pingsCache[id],
        };
    };

    /**
     * Sets location available state
     * @param location
     * @param state
     */
    setLocationAvailableState = (location: LocationInterface, state: boolean): void => {
        // eslint-disable-next-line no-param-reassign
        location.available = state;
    };

    /**
     * Sets location ping
     * @param location
     * @param ping
     */
    setLocationPing = (location: LocationInterface, ping: number | null): void => {
        // eslint-disable-next-line no-param-reassign
        location.ping = ping;
    };

    /**
     * Sets location endpoint
     * @param location
     * @param endpoint
     */
    setLocationEndpoint = (
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
     * Returns locations with pings, used for UI
     */
    getLocationsWithPing = (): LocationWithPing[] => {
        return this.locations.map((location: LocationInterface) => {
            const cachedPingData = this.getPingFromCache(location.id);
            if (cachedPingData) {
                this.setLocationPing(location, cachedPingData.ping);
                this.setLocationAvailableState(location, cachedPingData.available);
            }
            // after setting ping to location, it's type turns from LocationInterface to LocationWithPing
            return new LocationWithPing(location);
        });
    };

    updatePingsCache = (id: string, newData: IncomingPingData): void => {
        const oldData = this.pingsCache[id];
        if (oldData) {
            this.pingsCache[id] = { ...oldData, ...newData };
        } else {
            this.pingsCache[id] = {
                ping: null,
                available: true,
                lastMeasurementTime: 0,
                endpoint: null,
                isMeasuring: true,
                ...newData,
            };
        }

        this.state.pingsCache = this.pingsCache;
        this.saveLocationsServiceState();
    };

    /**
     * Moves endpoint to the start of endpoints if found, or returns the save endpoints list
     * @param endpoints
     * @param endpoint
     */
    moveToTheStart = (
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
     * If was unable to measure ping to all endpoints, returns first endpoint from the list
     * @param location
     * @param forcePrevEndpoint - boolean flag to measure ping of previously
     *  selected endpoint only
     */
    getEndpointAndPing = async (
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
    measurePing = async (location: LocationInterface, force: boolean): Promise<void> => {
        const { id } = location;

        // Do not begin pings measurement while it is measuring yet
        if (this.pingsCache[id]?.isMeasuring) {
            return;
        }

        const lastMeasurementTime = this.pingsCache[id]?.lastMeasurementTime;
        const isFresh = lastMeasurementTime
            ? !(Date.now() - lastMeasurementTime >= this.PING_TTL_MS)
            : false;

        const hasPing = !!this.pingsCache[id]?.ping;

        if (isFresh && hasPing && !force) {
            return;
        }

        this.updatePingsCache(location.id, { isMeasuring: true });

        const { ping, endpoint } = await this.getEndpointAndPing(location);

        this.setLocationPing(location, ping);
        const available = !!ping;
        this.setLocationAvailableState(location, available);

        this.updatePingsCache(
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
            this.getPingFromCache(location.id),
        );
    };

    /**
     * Removes pings from the cache and locations.
     *
     * Needed for "Refresh pings" button in the "Locations" screen in popup.
     */
    prunePings = (): void => {
        this.locations.forEach((location) => {
            this.updatePingsCache(location.id, { ping: null });
            // eslint-disable-next-line no-param-reassign
            location.ping = null;
        });
        const locations = this.getLocationsWithPing();
        notifier.notifyListeners(
            notifier.types.LOCATIONS_UPDATED,
            locations,
        );
    };

    /**
     * Flag used to control when it is possible to start pings measurement again
     */
    isMeasuring = false;

    /**
     * Measures pings for all locations.
     *
     * @param force Flag indicating that pings should be measured without checking ttl
     */
    measurePings = (force = false): void => {
        if (this.isMeasuring) {
            return;
        }

        this.isMeasuring = true;

        if (force) {
            this.prunePings();
        }

        (async () => {
            await Promise.all(this.locations.map((location) => {
                return this.measurePing(location, force);
            }));
            this.isMeasuring = false;
        })();
    };

    /**
     * Returns last measuring start time
     */
    isMeasuringPingInProgress = (): boolean => {
        return this.isMeasuring;
    };

    /**
     * Actualizes selected location data.
     * Returns selected location if it's endpoint was updated.
     */
    updateSelectedLocation = (): LocationInterface | null => {
        const oldSelectedLocation = this.selectedLocation;
        if (this.selectedLocation) {
            const actualLocation = this.locations.find((location) => {
                return location.id === this.selectedLocation?.id;
            });

            this.selectedLocation = actualLocation || this.selectedLocation;

            if (oldSelectedLocation?.endpoint?.id && this.selectedLocation?.endpoint?.id
                && oldSelectedLocation.endpoint.id !== this.selectedLocation.endpoint.id) {
                return this.selectedLocation;
            }
        }
        return null;
    };

    setLocations = (newLocations: LocationInterface[]) => {
        // copy previous pings data
        this.locations = newLocations.map((location: LocationInterface) => {
            const pingCache = this.pingsCache[location.id];
            if (pingCache) {
                this.setLocationPing(location, pingCache.ping);
                this.setLocationAvailableState(location, pingCache.available);
                this.setLocationEndpoint(location, pingCache.endpoint);
            }
            return location;
        });

        // launch pings measurement
        this.measurePings();

        notifier.notifyListeners(
            notifier.types.LOCATIONS_UPDATED,
            this.getLocationsWithPing(),
        );
    };

    /**
     * Retrieves locations from server
     * @param appId
     * @param vpnToken
     */
    getLocationsFromServer = async (appId: string, vpnToken: string): Promise<Location[]> => {
        const locationsData = await vpnProvider.getLocationsData(appId, vpnToken);

        const locations = locationsData.map((locationData: LocationInterface) => {
            return new Location(locationData);
        });

        // During endpoint deployments, api can return empty list of locations
        // thus we continue to use locations from memory
        if (!isEmpty(locations)) {
            this.setLocations(locations);
        } else {
            log.debug('Api returned empty list of locations', locations);
        }

        return locations;
    };

    /**
     * Returns available endpoint if found, or the first one
     * @param location
     * @param forcePrevEndpoint
     */
    getEndpoint = async (
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

        this.updatePingsCache(
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
            this.getPingFromCache(location.id),
        );

        if (!available) {
            throw new Error('Was unable to determine ping for endpoint');
        }

        return endpoint;
    };

    /**
     * Returns endpoint by location id
     * @param location
     * @param forcePrevEndpoint
     */
    getEndpointByLocation = async (
        location: LocationInterface,
        forcePrevEndpoint: boolean = false,
    ): Promise<EndpointInterface | null> => {
        let targetLocation: LocationInterface | undefined = location;

        // This could be empty on extension restart, but after we try to use the most fresh data
        if (this.locations && this.locations.length > 0) {
            targetLocation = this.locations.find((l) => {
                return l.id === location.id;
            });
        }

        if (!targetLocation) {
            return null;
        }

        return this.getEndpoint(targetLocation, forcePrevEndpoint);
    };

    /**
     * Returns location by endpoint id
     * @param endpointId
     */
    getLocationByEndpoint = (endpointId: string): LocationInterface | null => {
        if (!endpointId) {
            return null;
        }

        const location = this.locations.find((location) => {
            return location.endpoints.some((endpoint) => endpoint.id === endpointId);
        });

        return location || null;
    };

    /**
     * Persists selected location in the memory and storage
     * @param id - Location id
     * @param isLocationSelectedByUser - Flag indicating that location was selected by user
     */
    setSelectedLocation = async (id: string, isLocationSelectedByUser = false): Promise<void> => {
        this.selectedLocation = this.locations.find((location) => location.id === id) || null;
        await settings.setSetting(SETTINGS_IDS.SELECTED_LOCATION_KEY, this.selectedLocation);
        if (isLocationSelectedByUser) {
            await settings.setSetting(
                SETTINGS_IDS.LOCATION_SELECTED_BY_USER_KEY,
                isLocationSelectedByUser,
            );
        }
    };

    getIsLocationSelectedByUser = async (): Promise<boolean> => {
        const isLocationSelectedByUser = await settings.getSetting(
            SETTINGS_IDS.LOCATION_SELECTED_BY_USER_KEY,
        );
        return isLocationSelectedByUser;
    };

    /**
     * Returns selected location
     * when we connect to the location there is no time to find better location
     * returns null or selected location
     */
    getSelectedLocation = async (): Promise<LocationInterface | null> => {
        if (!this.selectedLocation) {
            // eslint-disable-next-line max-len
            const storedSelectedLocation = await settings.getSetting(SETTINGS_IDS.SELECTED_LOCATION_KEY);

            if (!storedSelectedLocation) {
                return null;
            }

            this.selectedLocation = new Location(storedSelectedLocation);
        }

        return this.selectedLocation;
    };

    /**
     * Retrieves locations tab from local storage.
     * If it doesn't exist or corrupted - sets default value.
     *
     * @returns Locations tab.
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
