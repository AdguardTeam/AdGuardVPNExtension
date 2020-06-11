import { measurePingToEndpointViaFetch } from '../connectivity/pingHelpers';
import notifier from '../../lib/notifier';
import { LocationWithPing } from './LocationWithPing';
import vpnProvider from '../providers/vpnProvider';
import { Location } from './Location';

const PING_TTL_MS = 1000 * 60 * 10; // 10 minutes

const pingsCache = {};

let locations = [];

/**
 * Returns locations instances
 */
const getLocations = () => {
    return locations;
};

/**
 * Returns locations with pings, used for UI
 * @returns {*}
 */
const getLocationsWithPing = () => {
    return locations.map((location) => {
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
    let ping = pingsCache[id]?.ping;
    const hasPing = !!ping;

    if (isFresh && hasPing) {
        location.setPing(ping);
        location.setAvailable(!!ping);
        return;
    }

    updatePingsCache(location, { isMeasuring: true });
    const endpointAndPing = await getEndpointAndPing(location);
    ({ ping } = endpointAndPing);

    location.setPing(ping);
    location.setAvailable(!!ping);

    updatePingsCache(
        location.id,
        {
            ping,
            isMeasuring: false,
            lastMeasurementTime: Date.now(),
        }
    );

    notifier.notifyListeners(
        notifier.types.LOCATION_STATE_UPDATED,
        {
            locationId: id,
            ping,
            available: location.available,
        }
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
    locations = newLocations;
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
    const { ping, endpoint } = await getEndpointAndPing(location);

    location.setPing(ping);
    location.setAvailable(!!ping);

    updatePingsCache(
        location.id,
        {
            ping,
            lastMeasurementTime: Date.now(),
        }
    );

    notifier.notifyListeners(
        notifier.types.LOCATION_STATE_UPDATED,
        {
            locationId: location.id,
            ping,
            available: location.available,
        }
    );

    if (!location.available) {
        return location.endpoints[0];
    }

    return endpoint;
};

/**
 * Returns endpoint by location id
 * @param locationId
 * @returns {Promise<*>}
 */
const getEndpointByLocation = async (locationId) => {
    const location = locations.find((location) => {
        return location.id === locationId;
    });
    return getEndpoint(location);
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

export const locationsService = {
    getEndpointByLocation,
    getLocationByEndpoint,
    getLocationsFromServer,
    getLocationsWithPing,
    getLocations,
    getEndpoint,
};
