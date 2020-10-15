import _ from 'lodash';
import { log } from '../../lib/logger';
import { measurePingToEndpointViaFetch } from '../connectivity/pingHelpers';
import notifier from '../../lib/notifier';
import { LocationWithPing } from './LocationWithPing';
import vpnProvider from '../providers/vpnProvider';
import { Location } from './Location';
import browserApi from '../browserApi';
import proxy from '../proxy';

const PING_TTL_MS = 1000 * 60 * 10; // 10 minutes

const pingsCache = {};

let locations = [];

let selectedLocation = null;

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
 * Sets location available state
 * @param location
 * @param state
 */
const setLocationAvailableState = (location, state) => {
    // eslint-disable-next-line no-param-reassign
    location.available = state;
};

/**
 * Sets location ping
 * @param location
 * @param ping
 */
const setLocationPing = (location, ping) => {
    // eslint-disable-next-line no-param-reassign
    location.ping = ping;
};

/**
 * Sets location endpoint
 * @param {Location} location
 * @param {Endpoint} endpoint
 */
const setLocationEndpoint = (location, endpoint) => {
    // eslint-disable-next-line no-param-reassign
    location.endpoint = endpoint;
};

/**
 * Returns locations with pings, used for UI
 * @returns {*}
 */
const getLocationsWithPing = () => {
    return locations.map((location) => {
        const cachedPingData = getPingFromCache(location.id);
        if (cachedPingData) {
            setLocationPing(location, cachedPingData.ping);
            setLocationAvailableState(location, cachedPingData.available);
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
            endpoint: null,
            ...newData,
        };
    }
};

/**
 * Moves endpoint to the start of endpoints if found, or returns the save endpoints list
 * @param endpoints
 * @param endpoint
 * @returns {*}
 */
const moveToTheStart = (endpoints, endpoint) => {
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
 * @param {boolean} forcePrevEndpoint - boolean flag to measure ping of previously
 *  selected endpoint only
 * @returns {Promise<{endpoint: <Endpoint>, ping: (number|null)}>}
 */
const getEndpointAndPing = async (location, forcePrevEndpoint = false) => {
    let endpoint;
    let ping = null;
    let i = 0;

    if (forcePrevEndpoint && location.endpoint) {
        const { endpoint } = location;
        ping = await measurePingToEndpointViaFetch(endpoint.domainName);
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
        ping = await measurePingToEndpointViaFetch(endpoint.domainName);
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
        const pingCache = pingsCache[location.id];
        if (pingCache) {
            setLocationPing(location, pingCache.ping);
            setLocationAvailableState(location, pingCache.available);
            setLocationEndpoint(location, pingCache.endpoint);
        }
        return location;
    });

    // we should actualize location according to the received locations data,
    // otherwise could happen cases when selected location contains wrong endpoints inside itself
    if (selectedLocation) {
        const actualLocation = locations.find((location) => {
            return location.id === selectedLocation.id;
        });

        selectedLocation = actualLocation || selectedLocation;
    }

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

    // During endpoint deployments, api can return empty list of locations
    // thus we continue to use locations from memory
    if (!_.isEmpty(locations)) {
        setLocations(locations);
    } else {
        log.debug('Api returned empty list of locations', locations);
    }

    return locations;
};

/**
 * Returns available endpoint if found, or the first one
 * @param {Location} location
 * @param {boolean} forcePrevEndpoint
 * @returns {Promise<*>}
 */
const getEndpoint = async (location, forcePrevEndpoint) => {
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
 * @param {boolean} forcePrevEndpoint
 * @returns {Promise<*>}
 */
const getEndpointByLocation = async (location, forcePrevEndpoint) => {
    let targetLocation = location;

    // This could be empty on extension restart, but after we try to use the most fresh data
    if (locations && locations.length > 0) {
        targetLocation = locations.find((l) => {
            return l.id === location.id;
        });
    }

    return getEndpoint(targetLocation, forcePrevEndpoint);
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

const SELECTED_LOCATION_KEY = 'endpoints.selected.location';

const setSelectedLocation = async (id) => {
    selectedLocation = locations.find((location) => location.id === id);
    await browserApi.storage.set(SELECTED_LOCATION_KEY, selectedLocation);
};

const getSelectedLocation = async () => {
    if (!selectedLocation) {
        const storedLocation = await browserApi.storage.get(SELECTED_LOCATION_KEY);
        if (!storedLocation) {
            // previously we used to store endpoint in the proxy module
            // try to get from endpoint
            // can be removed after few versions of v0.7
            const proxySelectedEndpoint = await proxy.getCurrentEndpoint();
            selectedLocation = getLocationByEndpoint(proxySelectedEndpoint?.id);
            if (!selectedLocation) {
                return null;
            }
        } else {
            selectedLocation = new Location(storedLocation);
        }
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
