import { measurePingToEndpointViaFetch } from '../connectivity/pingHelpers';
import notifier from '../../lib/notifier';
import { LocationWithPing } from './LocationWithPing';
import vpnProvider from '../providers/vpnProvider';
import { Location } from './Location';
import browserApi from '../browserApi';

const PING_TTL_MS = 1000 * 60 * 10; // 10 minutes

const pingsCache = {};

let locations = [];

/**
 * Returns locations instances
 */
const getLocations = () => {
    return locations;
};

const getPingFromCache = (id) => {
    return {
        locationId: id,
        ...pingsCache[id],
    };
};

/**
 * Returns locations with pings, used for UI
 * @returns {*}
 */
const getLocationsWithPing = () => {
    return locations.map((location) => {
        const cachedPingData = getPingFromCache(location.id);
        if (cachedPingData) {
            location.setPing(cachedPingData.ping);
            location.setAvailable(cachedPingData.available);
        }
        return new LocationWithPing(location);
    });
};

const updatePingsCache = (id, newData) => {
    const oldData = pingsCache[id];
    if (oldData) {
        pingsCache[id] = { ...oldData, ...newData };
    } else {
        pingsCache[id] = {
            ping: null,
            available: true,
            lastMeasurementTime: 0,
            ...newData,
        };
    }
};

/**
 * Measures pings to endpoints one by one, and returns first one available
 * If was unable to measure ping to all endpoints, returns first endpoint from the list
 * @param location
 * @returns {Promise<{endpoint: <Endpoint>, ping: (number|null)}>}
 */
const getEndpointAndPing = async (location) => {
    let endpoint;
    let ping = null;
    let i = 0;
    while (!ping && location.endpoints[i]) {
        endpoint = location.endpoints[i];
        // eslint-disable-next-line no-await-in-loop
        ping = await measurePingToEndpointViaFetch(endpoint.domainName) || null;
        i += 1;
    }

    if (!ping) {
        [endpoint] = location.endpoints;
    }

    return {
        ping,
        endpoint,
    };
};

/**
 * Determines ping for location and saves it in the pings cache
 * @param location
 * @returns {Promise<void>}
 */
const measurePing = async (location) => {
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
    const { ping } = await getEndpointAndPing(location);

    location.setPing(ping);
    const available = !!ping;
    location.setAvailable(available);

    updatePingsCache(
        location.id,
        {
            available,
            ping,
            isMeasuring: false,
            lastMeasurementTime: Date.now(),
        }
    );

    notifier.notifyListeners(
        notifier.types.LOCATION_STATE_UPDATED,
        getPingFromCache(location.id)
    );
};

/**
 * Measure pings for all locations
 */
const measurePings = () => {
    locations.forEach(async (location) => {
        await measurePing(location);
    });
};

const setLocations = (newLocations) => {
    // copy previous pings data
    locations = newLocations.map((location) => {
        const pingCache = pingsCache[location];
        if (pingCache) {
            location.setPing(pingCache.ping);
            location.setAvailable(pingCache.available);
        }
        return location;
    });

    // launch pings measurement
    measurePings();

    notifier.notifyListeners(
        notifier.types.LOCATIONS_UPDATED,
        getLocationsWithPing()
    );
};

/**
 * Retrieves locations from server
 * @param vpnToken
 * @returns {Promise<Location[]>}
 */
const getLocationsFromServer = async (vpnToken) => {
    const locationsData = await vpnProvider.getLocationsData(vpnToken);

    const locations = locationsData.map((locationData) => {
        return new Location(locationData);
    });

    setLocations(locations);

    return locations;
};

/**
 * Returns available endpoint if found, or the first one
 * @param location
 * @returns {Promise<*>}
 */
const getEndpoint = async (location) => {
    if (!location) {
        return null;
    }

    const { ping, endpoint } = await getEndpointAndPing(location);

    location.setPing(ping);
    const available = !!ping;
    location.setAvailable(available);

    updatePingsCache(
        location.id,
        {
            available,
            ping,
            lastMeasurementTime: Date.now(),
        }
    );

    notifier.notifyListeners(
        notifier.types.LOCATION_STATE_UPDATED,
        getPingFromCache(location.id)
    );

    if (!available) {
        throw new Error('Was unable to determine ping for endpoint');
    }

    return endpoint;
};

/**
 * Returns endpoint by location id
 * @param location
 * @returns {Promise<*>}
 */
const getEndpointByLocation = async (location) => {
    let targetLocation = location;

    // This could be empty on extension restart, but after we try to use the most fresh data
    if (locations && locations.length > 0) {
        targetLocation = locations.find((l) => {
            return l.id === location.id;
        });
    }

    return getEndpoint(targetLocation);
};

/**
 * Returns location by endpoint id
 * @param endpointId
 */
const getLocationByEndpoint = (endpointId) => {
    if (!endpointId) {
        return null;
    }

    const location = locations.find((location) => {
        return location.endpoints.some((endpoint) => endpoint.id === endpointId);
    });

    return location;
};

let selectedLocation = null;
const SELECTED_LOCATION_KEY = 'endpoints.selected.location';

const setSelectedLocation = async (id) => {
    selectedLocation = locations.find((location) => location.id === id);
    await browserApi.storage.set(SELECTED_LOCATION_KEY, selectedLocation);
};

const getSelectedLocation = async () => {
    if (!selectedLocation) {
        const storedLocation = await browserApi.storage.get(SELECTED_LOCATION_KEY);
        selectedLocation = new Location(storedLocation);
    }
    return selectedLocation;
};

export const locationsService = {
    getEndpointByLocation,
    getLocationByEndpoint,
    getLocationsFromServer,
    getLocationsWithPing,
    setSelectedLocation,
    getSelectedLocation,
    getLocations,
    getEndpoint,
};
