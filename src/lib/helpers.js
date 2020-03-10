import sortBy from 'lodash/sortBy';
import getDistance from 'geolib/es/getDistance';
import chunk from 'lodash/chunk';

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
const getUrlProperties = (url) => {
    let urlObj;

    try {
        urlObj = new URL(url);
    } catch (e) {
        return url;
    }

    return urlObj;
};

/**
 * Returns hostname of url if it was correct, otherwise return input url
 * @param {string} url
 * @returns {string}
 */
export const getHostname = (url) => {
    const urlObj = getUrlProperties(url);
    const hostname = (urlObj && urlObj.hostname) ? urlObj.hostname : url;
    return hostname;
};

/**
 * Returns protocol of url if it was correct, otherwise return input url
 * @param {string} url
 * @returns {string}
 */

export const getProtocol = (url) => {
    const urlObj = getUrlProperties(url);
    const protocol = (urlObj && urlObj.protocol) ? urlObj.protocol : url;
    return protocol;
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
        return {
            value: '0.0',
            unit: 'KB',
        };
    }

    const DECIMALS = 1;
    const UNITS = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const k = 1000;

    const i = Math.floor(Math.log(bytes) / Math.log(k)) || 1;

    return {
        value: parseFloat(bytes / (k ** i))
            .toFixed(DECIMALS),
        unit: UNITS[i],
    };
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

/**
 * Runs generator with possibility to cancel
 * @param fn - generator to run
 * @param args - args
 * @returns {{cancel: Function, promise: Promise<unknown>}}
 */
export const runWithCancel = (fn, ...args) => {
    const gen = fn(...args);
    let cancelled;
    let cancel;
    const promise = new Promise((resolve, reject) => {
        // define cancel function to return it from our fn
        cancel = (reason) => {
            cancelled = true;
            const cancelReason = `${fn.name} was canceled with reason: "${reason}"`;
            // eslint-disable-next-line prefer-promise-reject-errors
            reject({ reason: cancelReason });
        };

        // eslint-disable-next-line consistent-return
        function onFulfilled(res) {
            if (!cancelled) {
                let result;
                try {
                    result = gen.next(res);
                } catch (e) {
                    return reject(e);
                }
                // eslint-disable-next-line no-use-before-define
                next(result);
            }
        }

        // eslint-disable-next-line consistent-return
        function onRejected(err) {
            let result;
            try {
                result = gen.throw(err);
            } catch (e) {
                return reject(e);
            }
            // eslint-disable-next-line no-use-before-define
            next(result);
        }

        function next({ done, value }) {
            if (done) {
                return resolve(value);
            }
            // we assume we always receive promises, so no type checks
            return value.then(onFulfilled, onRejected);
        }

        onFulfilled();
    });

    return { promise, cancel };
};

/**
 * Identity function, useful for filtering undefined values
 * @param i
 * @returns {*}
 */
export const identity = (i) => i;

/**
 * Handles data asynchronously by small chunks
 * @param {any[]} arr - array of data
 * @param {number} size - size of the chunk
 * @param {Function} handler - async function which handles data and returns promise
 * @returns {Promise<any[]>}
 */
export const asyncMapByChunks = async (arr, handler, size) => {
    const chunks = chunk(arr, size);

    const result = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const chunk of chunks) {
        const promises = chunk.map(handler);
        // eslint-disable-next-line no-await-in-loop
        const data = await Promise.all(promises);
        result.push(data);
    }

    return result.flat(1);
};
