import punycode from 'punycode';

import { LocationInterface, LocationWithPingInterface } from '../background/endpoints/Location';

/**
 * Returns the value of the property from the cache,
 * otherwise, calculates it using the callback, memoizes it, and returns the value
 */
export const lazyGet = (obj: any, prop: string, func: () => any) => {
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
 * Normalizes exclusions url
 * 1. trims it
 * 2. converts to lowercase
 * 3. removes `https://www.` and `/` at the end of the line
 * 4. converts to ASCII
 * save hostnames as ASCII because 'pacScript.url' supports only ASCII URLs
 * https://chromium.googlesource.com/chromium/src/+/3a46e0bf9308a42642689c4b73b6b8622aeecbe5/chrome/browser/extensions/api/proxy/proxy_api_helpers.cc#115
 * @param rawUrl
 */
export const prepareUrl = (rawUrl: string) => {
    const url = rawUrl
        ?.trim()
        ?.toLowerCase()
        ?.replace(/(http(s)?:\/\/)?(www\.)?/, '')
        ?.replace(/\/$/, '');
    return punycode.toASCII(url);
};

/**
 * Selects location with lowest ping taking in consideration pingBonus
 * pingBonus is an number which comes from backend and it is used to
 * adjust default location selection
 */
export const getLocationWithLowestPing = (locations: LocationInterface[]): LocationWithPingInterface => {
    // filter locations by ping,
    // so array of filtered locations will be LocationInterfaceWithPing[] instead of LocationInterface[]
    // @ts-ignore
    const locationsWithPings: LocationWithPingInterface[] = locations
        .filter((location) => location.ping && location.ping > 0);
    const sortedByPing = locationsWithPings.sort((locationA, locationB) => {
        const adjustedPingA = locationA.ping - locationA.pingBonus;
        const adjustedPingB = locationB.ping - locationB.pingBonus;
        return adjustedPingA - adjustedPingB;
    });
    return sortedByPing[0];
};

/**
 * Formats bytes into units
 * @param bytes
 * @param decimals - number of digits after decimal point
 */
export const formatBytes = (bytes: number, decimals: number = 1): { unit: string, value: string } => {
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
        value: parseFloat(String(bytes / (k ** i)))
            .toFixed(decimals),
        unit: UNITS[i],
    };
};

/**
 * Sleeps given period of time
 * @param wait
 */
export const sleep = (wait: number): Promise<unknown> => {
    return new Promise((resolve) => {
        setTimeout(resolve, wait);
    });
};

/**
 * Sleeps necessary period of time if minimum duration didn't pass since entry time
 * @param entryTimeMs
 * @param minDurationMs
 */
export const sleepIfNecessary = async (entryTimeMs: number, minDurationMs: number) => {
    if (Date.now() - entryTimeMs < minDurationMs) {
        await sleep(minDurationMs - (Date.now() - entryTimeMs));
    }
};

/**
 * Executes async function with at least required time
 * @param fn
 * @param minDurationMs
 */
export const addMinDurationTime = (fn: (...args: any) => any, minDurationMs: number) => {
    return async (...args: string[]) => {
        const start = Date.now();

        try {
            const response = await fn(...args);
            await sleepIfNecessary(start, minDurationMs);
            return response;
        } catch (e) {
            await sleepIfNecessary(start, minDurationMs);
            throw e;
        }
    };
};

/**
 * Runs generator with possibility to cancel
 * @param fn - generator to run
 * @param args - args
 */
export const runWithCancel = (fn: (...args: any) => any, ...args: any):
{ cancel?: Function, promise: Promise<unknown> } => {
    const gen = fn(...args);
    let cancelled: boolean;
    let cancel;
    const promise = new Promise((resolve, reject) => {
        // define cancel function to return it from our fn
        cancel = (reason: string) => {
            cancelled = true;
            reject(new Error(reason));
        };

        // eslint-disable-next-line consistent-return
        function onFulfilled(res?: string) {
            if (!cancelled) {
                let result;
                try {
                    result = gen.next(res);
                } catch (e) {
                    return reject(e);
                }
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                next(result);
            }
        }

        // eslint-disable-next-line consistent-return
        function onRejected(err: Error) {
            let result;
            try {
                result = gen.throw(err);
            } catch (e) {
                return reject(e);
            }
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            next(result);
        }

        function next({ done, value }: { done: boolean, value: Promise<any> }) {
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
