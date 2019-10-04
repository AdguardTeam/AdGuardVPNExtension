import sortBy from 'lodash/sortBy';

/**
 * Returns the value of the property from the cache,
 * otherwise, calculates it using the callback, memoizes it, and returns the value
 * @param {object} obj
 * @param {string} prop
 * @param {function} func
 * @returns {any}
 */
export const lazyGet = (obj, prop, func) => {
    const cachedProp = `_${prop}`;
    if (cachedProp in obj) {
        return obj[cachedProp];
    }

    const value = func.apply(obj);
    // eslint-disable-next-line no-param-reassign
    obj[cachedProp] = value;
    return value;
};

/**
 * Returns hostname of url if it was correct, otherwise return input url
 * @param {string} url
 * @returns {string}
 */
export const getHostname = (url) => {
    let urlObj;

    try {
        urlObj = new URL(url);
    } catch (e) {
        return url;
    }

    return urlObj.hostname;
};

/**
 * Convert Degrees to Radians
 * @param {number} deg
 * @returns {number}
 */
const Deg2Rad = (deg) => {
    return deg * Math.PI / 180;
};


/**
 * Return the distance between two points
 * @param {[number, number]} coordinates1
 * @param {[number, number]} coordinates2
 * @returns {number}
 */
const getDistance = (coordinates1, coordinates2) => {
    let [lat1, lon1] = coordinates1;
    let [lat2, lon2] = coordinates2;
    lat1 = Deg2Rad(lat1);
    lat2 = Deg2Rad(lat2);
    lon1 = Deg2Rad(lon1);
    lon2 = Deg2Rad(lon2);
    const EARTH_RADIUS_KM = 6371;
    const x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2);
    const y = (lat2 - lat1);
    return Math.sqrt(x * x + y * y) * EARTH_RADIUS_KM;
};

/**
 * Returns the closest endpoint to the current coordinates
 * @param {{ coordinates: [number, number] }} currentEndpoint
 * @param {{ coordinates: [number, number] }[]} endpoints
 * @returns {{ coordinates: [number, number] }}
 */

export const getClosestEndpointByCoordinates = (currentEndpoint, endpoints) => {
    const { coordinates } = currentEndpoint;
    const distances = endpoints.map(endpoint => ({
        endpoint,
        distance: getDistance(coordinates, endpoint.coordinates),
    }));
    const sortedDistances = sortBy(distances, 'distance');
    return sortedDistances[0].endpoint;
};
