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
 * Sorts locations by distance to the target location
 * If no current endpoint provided, returns locations unsorted
 * @param {Locations[]} locations
 * @param {Location} targetLocation
 * @returns {Location[]}
 */
export const sortByDistance = (locations, targetLocation) => {
    if (!targetLocation) {
        return locations;
    }

    const { coordinates } = targetLocation;

    const distances = locations.map((location) => {
        const [lon1, lat1] = coordinates;
        const [lon2, lat2] = location.coordinates;

        const currentCoordinates = { longitude: lon1, latitude: lat1 };
        const locationCoordinates = { longitude: lon2, latitude: lat2 };

        return {
            location,
            distance: getDistance(currentCoordinates, locationCoordinates),
        };
    });

    const sortedDistances = sortBy(distances, 'distance');
    return sortedDistances.map((sorted) => sorted.location);
};

/**
 * Returns closest endpoint
 * @param {Locations[]} locations
 * @param {Location} targetLocation
 * @returns {Location}
 */
export const getClosestLocationToTarget = (locations, targetLocation) => {
    return sortByDistance(locations, targetLocation)[0];
};

/**
 * Formats bytes into units
 * @param {number} bytes
 * @param {number} decimals - number of digits after decimal point
 * @returns {{unit: string, value: string}}
 */
export const formatBytes = (bytes, decimals = 1) => {
    if (!bytes || bytes <= 0) {
        return {
            value: '0.0',
            unit: 'KB',
        };
    }

    const UNITS = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const k = 1024;

    const i = Math.floor(Math.log(bytes) / Math.log(k)) || 1;

    return {
        value: parseFloat(bytes / (k ** i))
            .toFixed(decimals),
        unit: UNITS[i],
    };
};

/**
 * Sleeps given period of time
 * @param wait
 * @returns {Promise<unknown>}
 */
export const sleep = (wait) => {
    return new Promise((resolve) => {
        setTimeout(resolve, wait);
    });
};

/**
 * Sleeps necessary period of time if minimum duration didn't pass since entry time
 * @param {number} entryTimeMs
 * @param {number} minDurationMs
 * @returns {Promise<void>}
 */
export const sleepIfNecessary = async (entryTimeMs, minDurationMs) => {
    if (Date.now() - entryTimeMs < minDurationMs) {
        await sleep(minDurationMs - (Date.now() - entryTimeMs));
    }
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
            reject(new Error(reason));
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
