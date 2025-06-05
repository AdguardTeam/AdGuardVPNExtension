import { utc } from '@date-fns/utc';
import { format, parse } from 'date-fns';

/**
 * Format of date keys used in statistics storage in hourly buckets.
 *
 * Note: Keys are formatted in UTC time.
 */
const HOURLY_KEY_FORMAT = 'yyyy-MM-dd-HH';

/**
 * Format of date keys used in statistics storage in daily buckets.
 *
 * Note: Keys are formatted in UTC time.
 */
const DAILY_KEY_FORMAT = 'yyyy-MM-dd';

/**
 * Array of supported date formats for statistics storage.
 */
const DATE_FORMATS = [HOURLY_KEY_FORMAT, DAILY_KEY_FORMAT];

/**
 * Default value to use for missing parts of the date when parsing keys.
 * For example, if the key is '2023-04-01', we want to set hours to 0.
 */
const MISSING_PARTS_VALUE = 0;

/**
 * Gets dash separated storage key for the current date in UTC format.
 *
 * @example
 * ```ts
 * StatisticsStorage.dateToKey(false); // 2025-05-19
 * StatisticsStorage.dateToKey(true); // 2025-05-19-12
 * StatisticsStorage.dateToKey(false, new Date('2023-04-01T12:00:00Z')); // 2023-04-01
 * StatisticsStorage.dateToKey(true, new Date('2023-04-01T12:00:00Z')); // 2023-04-01-12
 * ```
 *
 * @param includeHours Whether to include hours in the date string.
 * @param date Date to convert. If not provided, current date is used.
 *
 * @returns Key of current date in UTC format.
 */
export function dateToKey(includeHours: boolean, date = new Date()): string {
    const keyFormat = includeHours
        ? HOURLY_KEY_FORMAT
        : DAILY_KEY_FORMAT;

    return format(date, keyFormat, { in: utc });
}

/**
 * Converts a date key to a Date object.
 * The key should be in the format {@link DAILY_KEY_FORMAT} or {@link HOURLY_KEY_FORMAT}.
 * If hour is not provided, it will be set to 0.
 *
 * @example
 * ```ts
 * StatisticsStorage.keyToDate('2023-04-01'); // 2023-04-01T00:00:00.000Z
 * StatisticsStorage.keyToDate('2023-04-01-12'); // 2023-04-01T12:00:00.000Z
 * StatisticsStorage.keyToDate('2023-04-01-12-30'); // null
 * ```
 *
 * @param key Key to convert.
 *
 * @returns Date object or null if the key is not valid.
 */
export function keyToDate(key: string): Date | null {
    for (let i = 0; i < DATE_FORMATS.length; i += 1) {
        const date = parse(key, DATE_FORMATS[i], MISSING_PARTS_VALUE, { in: utc });
        if (!Number.isNaN(date.getTime())) {
            return date;
        }
    }

    return null;
}

/**
 * Creates a deep proxy for an object that watches for changes to nested properties.
 *
 * @param obj Object to create a deep proxy for.
 * @param callback Callback to call when a property (or nested property) is changed.
 *
 * @returns Proxied object.
 */
export function watchChanges<T extends object>(obj: T, callback: () => void): T {
    const proxyCache = new WeakMap<object, any>();

    const createProxy = <Obj extends object>(target: Obj): Obj => {
        if (proxyCache.has(target)) {
            return proxyCache.get(target);
        }

        const handler: ProxyHandler<Obj> = {
            get(target, key, receiver) {
                const value = Reflect.get(target, key, receiver);

                if (typeof value === 'object' && value !== null) {
                    return createProxy(value);
                }

                return value;
            },

            set(target, key, value, receiver) {
                const oldValue = target[key as keyof Obj];
                const result = Reflect.set(target, key, value, receiver);

                if (oldValue !== value) {
                    callback();
                }

                return result;
            },

            deleteProperty(target, key) {
                const hadKey = key in target;
                const result = Reflect.deleteProperty(target, key);

                if (hadKey && result) {
                    callback();
                }

                return result;
            },
        };

        const proxy = new Proxy(target, handler);
        proxyCache.set(target, proxy);
        return proxy;
    };

    return createProxy(obj);
}
