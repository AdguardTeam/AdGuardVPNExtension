import sortBy from 'lodash/sortBy';
import getDistance from 'geolib/es/getDistance';

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
 * Returns the closest endpoint to the current coordinates
 * @param {{ coordinates: [number, number] }} currentEndpoint
 * @param {{ coordinates: [number, number] }[]} endpoints
 * @returns {{ coordinates: [number, number] }}
 */
export const getClosestEndpointByCoordinates = (currentEndpoint, endpoints) => {
    const { coordinates } = currentEndpoint;
    const distances = endpoints.map((endpoint) => {
        const [lon1, lat1] = coordinates;
        const [lon2, lat2] = endpoint.coordinates;

        const currentCoordinates = { longitude: lon1, latitude: lat1 };
        const endpointCoordinates = { longitude: lon2, latitude: lat2 };

        return {
            endpoint,
            distance: getDistance(currentCoordinates, endpointCoordinates),
        };
    });
    const sortedDistances = sortBy(distances, 'distance');
    return sortedDistances[0].endpoint;
};

/**
 * Formats bytes into units
 * @param {number} bytes
 * @returns {{unit: string, value: string}}
 */
export const formatBytes = (bytes) => {
    if (!bytes) {
        return { value: '0.0', unit: 'KB' };
    }

    const DECIMALS = 1;
    const UNITS = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const k = 1000;

    const i = Math.floor(Math.log(bytes) / Math.log(k)) || 1;

    return { value: parseFloat(bytes / (k ** i)).toFixed(DECIMALS), unit: UNITS[i] };
};

/**
 * awaits given period of time
 * @param wait
 * @returns {Promise<unknown>}
 */
export const sleep = (wait) => {
    return new Promise((resolve) => {
        setTimeout(resolve, wait);
    });
};
