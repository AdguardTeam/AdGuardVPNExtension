import punycode from 'punycode';

import { type LocationInterface } from '../background/schema';

/**
 * Returns the value of the property from the cache,
 * otherwise, calculates it using the callback, memoizes it, and returns the value.
 *
 * @param obj Object to store the property.
 * @param prop Property name.
 * @param getter Callback to get the value.
 *
 * @returns Property value.
 */
export const lazyGet = <T>(obj: Record<string, any>, prop: string, func: () => T): T => {
    const cachedProp = `_${prop}`;
    if (cachedProp in obj) {
        return obj[cachedProp];
    }

    const value = func.apply(obj);
    // eslint-disable-next-line no-param-reassign
    obj[cachedProp] = value;
    return value;
};

// TODO: looks like not used, consider removing
/**
 * Normalizes exclusions url
 * 1. trims it
 * 2. converts to lowercase
 * 3. removes `https://www.` and `/` at the end of the line
 * 4. converts to ASCII
 * save hostnames as ASCII because 'pacScript.url' supports only ASCII URLs
 * https://chromium.googlesource.com/chromium/src/+/3a46e0bf9308a42642689c4b73b6b8622aeecbe5/chrome/browser/extensions/api/proxy/proxy_api_helpers.cc#115
 * @param rawUrl
 *
 * @returns Prepared URL.
 */
export const prepareUrl = (rawUrl: string): string => {
    const url = rawUrl
        ?.trim()
        ?.toLowerCase()
        ?.replace(/(http(s)?:\/\/)?(www\.)?/, '')
        ?.replace(/\/$/, '');
    return punycode.toASCII(url);
};

/**
 * Location data required to compare locations by effective ping.
 */
interface LocationWithEffectivePing {
    /**
     * Real ping in milliseconds.
     */
    ping: number;

    /**
     * Backend-provided bonus subtracted from the real ping (ms).
     */
    pingBonus: number;
}

/**
 * Compares locations by the effective ping used to choose the fastest location.
 * The backend subtracts `pingBonus` from the real ping to promote or pessimize
 * a location, so the effective ping is what drives the fastest-location choice.
 * A negative bonus makes the effective ping greater than the real one.
 *
 * @param locationA First location.
 * @param locationB Second location.
 *
 * @returns Negative when the first location is faster, positive when slower.
 */
export const compareByEffectivePing = (
    locationA: LocationWithEffectivePing,
    locationB: LocationWithEffectivePing,
): number => {
    const effectivePingA = locationA.ping - locationA.pingBonus;
    const effectivePingB = locationB.ping - locationB.pingBonus;

    return effectivePingA - effectivePingB;
};

/**
 * Selects the location with the lowest effective ping, taking the backend
 * ping bonus into account.
 *
 * @param locations Locations to choose from.
 *
 * @returns Location with the lowest effective ping, or undefined when no location has a ping.
 */
export const getLocationWithLowestPing = (locations: LocationInterface[]): LocationInterface | undefined => {
    const locationsWithPings = locations.filter(
        (location): location is LocationInterface & LocationWithEffectivePing => {
            return !!location.ping && location.ping > 0;
        },
    );

    return locationsWithPings.sort(compareByEffectivePing)[0];
};

/**
 * Whether the location is selectable for the current token: premium-only
 * locations are available only to premium users.
 *
 * @param location Location to check.
 * @param isPremiumToken Whether the user has a premium token.
 *
 * @returns True when the location can be selected.
 */
export const isLocationAvailableForToken = (
    location: { premiumOnly: boolean },
    isPremiumToken: boolean,
): boolean => isPremiumToken || location.premiumOnly === false;

/**
 * Formats bytes into units.
 *
 * @param bytes
 * @param decimals number of digits after decimal point
 *
 * @returns Object with unit and value.
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
 * Sleeps given period of time.
 *
 * @param wait
 *
 * @returns Promise that resolves after given period of time.
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
export const sleepIfNecessary = async (entryTimeMs: number, minDurationMs: number): Promise<void> => {
    if (Date.now() - entryTimeMs < minDurationMs) {
        await sleep(minDurationMs - (Date.now() - entryTimeMs));
    }
};

/**
 * Executes async function with at least required time.
 *
 * @param fn
 * @param minDurationMs
 *
 * @returns Async function that executes with at least required time.
 */
export const addMinDurationTime = (fn: (...args: any) => any, minDurationMs: number) => {
    return async (...args: string[]): Promise<any> => {
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
 *
 * @param fn generator to run
 * @param args args
 *
 * @returns Object with cancel function and promise.
 */
export const runWithCancel = (fn: (...args: any) => any, ...args: any):
{ cancel?: Function, promise: Promise<unknown> } => {
    const gen = fn(...args);
    let cancelled: boolean;
    let cancel;
    const promise = new Promise((resolve, reject) => {
        // define cancel function to return it from our fn
        cancel = (reason: string): void => {
            cancelled = true;
            reject(new Error(reason));
        };

        // eslint-disable-next-line consistent-return
        function onFulfilled(res?: string): void {
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
        function onRejected(err: Error): void {
            let result;
            try {
                result = gen.throw(err);
            } catch (e) {
                return reject(e);
            }
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            next(result);
        }

        function next({ done, value }: { done: boolean, value: Promise<any> }): Promise<void> | void {
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
 * Generates forwarder URL with the given query.
 *
 * @param forwarderDomain Forwarder domain.
 * @param query Query string with parameters.
 *
 * @returns URL with the forwarder domain and query.
 */
export const getForwarderUrl = (forwarderDomain: string, query: string): string => {
    return `https://${forwarderDomain}/forward.html?${query}`;
};
