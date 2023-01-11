import isEmpty from 'lodash/isEmpty';
import { log } from '../../lib/logger';
import { measurePingWithinLimits } from '../connectivity/pingHelpers';
import { notifier } from '../../lib/notifier';
import { LocationWithPing, LocationWithPingProps } from './LocationWithPing';
import { vpnProvider } from '../providers/vpnProvider';
import { Location, LocationInterface, LocationData } from './Location';
import { SETTINGS_IDS } from '../../lib/constants';
// eslint-disable-next-line import/no-cycle
import { settings } from '../settings';
import { EndpointInterface } from './Endpoint';

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

export interface PingsCacheInterface {
    [id: string]: PingData;
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
}

const PING_TTL_MS = 1000 * 60 * 10; // 10 minutes

const pingsCache: PingsCacheInterface = {};

let locations: LocationInterface[] = [];

let selectedLocation: LocationInterface | null = null;

/**
 * Returns locations instances
 */
const getLocations = (): LocationInterface[] => {
    return locations;
};

const getPingFromCache = (id: string) => {
    return {
        locationId: id,
        ...pingsCache[id],
    };
};

/**
 * Sets location available state
 */
const setLocationAvailableState = (location: LocationInterface, state: boolean): void => {
    // eslint-disable-next-line no-param-reassign
    location.available = state;
};

/**
 * Sets location ping
 */
const setLocationPing = (location: LocationInterface, ping: number | null): void => {
    // eslint-disable-next-line no-param-reassign
    location.ping = ping;
};

/**
 * Sets location endpoint
 */
const setLocationEndpoint = (
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
 * @returns {*}
 */
const getLocationsWithPing = (): LocationWithPing[] => {
    return locations.map((location: LocationInterface) => {
        const cachedPingData = getPingFromCache(location.id);
        if (cachedPingData) {
            setLocationPing(location, cachedPingData.ping);
            setLocationAvailableState(location, cachedPingData.available);
        }
        // after setting ping to location, it's type turns from LocationInterface to LocationWithPing
        return new LocationWithPing(<LocationWithPingProps>location);
    });
};

const updatePingsCache = (id: string, newData: IncomingPingData): void => {
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
};

/**
 * Moves endpoint to the start of endpoints if found, or returns the save endpoints list
 */
const moveToTheStart = (
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
 * forcePrevEndpoint - boolean flag to measure ping of previously selected endpoint only
 */
const getEndpointAndPing = async (
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
        endpoints = moveToTheStart(endpoints, location.endpoint);
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
 */
const measurePing = async (location: LocationInterface): Promise<void> => {
    const { id } = location;

    // Do not begin pings measurement while it is measuring yet
    if (pingsCache[id]?.isMeasuring) {
        return;
    }

    const lastMeasurementTime = pingsCache[id]?.lastMeasurementTime;
    const isFresh = lastMeasurementTime
        ? !(Date.now() - lastMeasurementTime >= PING_TTL_MS)
        : false;

    const hasPing = !!pingsCache[id]?.ping;

    if (isFresh && hasPing) {
        return;
    }

    updatePingsCache(location.id, { isMeasuring: true });
    const { ping, endpoint } = await getEndpointAndPing(location);

    setLocationPing(location, ping);
    const available = !!ping;
    setLocationAvailableState(location, available);

    updatePingsCache(
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
        getPingFromCache(location.id),
    );
};

/**
 * Flag used to control when it is possible to start pings measurement again
 * @type {boolean}
 */
let isMeasuring = false;

/**
 * Measure pings for all locations
 */
const measurePings = (): void => {
    if (isMeasuring) {
        return;
    }

    isMeasuring = true;

    (async () => {
        await Promise.all(locations.map((location) => {
            return measurePing(location);
        }));
        isMeasuring = false;
    })();
};

/**
 * Returns last measuring start time
 * @returns {boolean}
 */
export const isMeasuringPingInProgress = () => {
    return isMeasuring;
};

/**
 * Actualizes selected location data.
 * Returns selected location if it's endpoint was updated.
 */
const updateSelectedLocation = (): LocationInterface | null => {
    const oldSelectedLocation = selectedLocation;
    if (selectedLocation) {
        const actualLocation = locations.find((location) => {
            return location.id === selectedLocation?.id;
        });

        selectedLocation = actualLocation || selectedLocation;

        if (oldSelectedLocation?.endpoint?.id && selectedLocation?.endpoint?.id
            && oldSelectedLocation.endpoint.id !== selectedLocation.endpoint.id) {
            return selectedLocation;
        }
    }
    return null;
};

const setLocations = (newLocations: LocationInterface[]) => {
    // copy previous pings data
    locations = newLocations.map((location: LocationInterface) => {
        const pingCache = pingsCache[location.id];
        if (pingCache) {
            setLocationPing(location, pingCache.ping);
            setLocationAvailableState(location, pingCache.available);
            setLocationEndpoint(location, pingCache.endpoint);
        }
        return location;
    });

    // launch pings measurement
    measurePings();

    notifier.notifyListeners(
        notifier.types.LOCATIONS_UPDATED,
        getLocationsWithPing(),
    );
};

/**
 * Retrieves locations from server
 */
const getLocationsFromServer = async (appId: string, vpnToken: string): Promise<Location[]> => {
    const locationsData = await vpnProvider.getLocationsData(appId, vpnToken);

    const locations = locationsData.map((locationData: LocationData) => {
        return new Location(locationData);
    });

    // During endpoint deployments, api can return empty list of locations
    // thus we continue to use locations from memory
    if (!isEmpty(locations)) {
        setLocations(locations);
    } else {
        log.debug('Api returned empty list of locations', locations);
    }

    return locations;
};

/**
 * Returns available endpoint if found, or the first one
 */
const getEndpoint = async (
    location: LocationInterface,
    forcePrevEndpoint: boolean,
): Promise<EndpointInterface | null> => {
    if (!location) {
        return null;
    }

    const { ping, endpoint } = await getEndpointAndPing(location, forcePrevEndpoint);

    setLocationPing(location, ping);
    setLocationEndpoint(location, endpoint);
    const available = !!ping;
    setLocationAvailableState(location, available);

    updatePingsCache(
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
        getPingFromCache(location.id),
    );

    if (!available) {
        throw new Error('Was unable to determine ping for endpoint');
    }

    return endpoint;
};

/**
 * Returns endpoint by location id
 */
const getEndpointByLocation = async (
    location: LocationInterface,
    forcePrevEndpoint: boolean,
): Promise<EndpointInterface | null> => {
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

    return getEndpoint(targetLocation, forcePrevEndpoint);
};

/**
 * Returns location by endpoint id
 */
const getLocationByEndpoint = (endpointId: string): LocationInterface | null => {
    if (!endpointId) {
        return null;
    }

    const location = locations.find((location) => {
        return location.endpoints.some((endpoint) => endpoint.id === endpointId);
    });

    return location || null;
};

/**
 * Persists selected location in the memory and storage
 * isLocationSelectedByUser - Flag indicating that location was selected by user
 */
const setSelectedLocation = async (id: string, isLocationSelectedByUser = false): Promise<void> => {
    selectedLocation = locations.find((location) => location.id === id) || null;
    await settings.setSetting(SETTINGS_IDS.SELECTED_LOCATION_KEY, selectedLocation);
    if (isLocationSelectedByUser) {
        await settings.setSetting(
            SETTINGS_IDS.LOCATION_SELECTED_BY_USER_KEY,
            isLocationSelectedByUser,
        );
    }
};

const getIsLocationSelectedByUser = async (): Promise<boolean> => {
    const isLocationSelectedByUser = await settings.getSetting(
        SETTINGS_IDS.LOCATION_SELECTED_BY_USER_KEY,
    );
    return isLocationSelectedByUser;
};

/**
 * Returns selected location
 *  when we connect to the location there is no time to find better location
 * @returns {Promise<null|object>} return null or selected location
 */
const getSelectedLocation = async (): Promise<LocationInterface | null> => {
    if (!selectedLocation) {
        // eslint-disable-next-line max-len
        const storedSelectedLocation = await settings.getSetting(SETTINGS_IDS.SELECTED_LOCATION_KEY);

        if (!storedSelectedLocation) {
            return null;
        }

        selectedLocation = new Location(storedSelectedLocation);
    }

    return selectedLocation;
};

export const locationsService: LocationsServiceInterface = {
    getIsLocationSelectedByUser,
    getLocationsFromServer,
    updateSelectedLocation,
    getEndpointByLocation,
    getLocationByEndpoint,
    getLocationsWithPing,
    setSelectedLocation,
    getSelectedLocation,
    getLocations,
    getEndpoint,
};
