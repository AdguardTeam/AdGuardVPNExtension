import { utc } from '@date-fns/utc';
import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';

/**
 * Format of date keys used in statistics storage in hourly buckets.
 *
 * Note: Keys are formatted in UTC time.
 */
const HOURLY_KEY_FORMAT = 'yyyy-MM-dd-HH';

/**
 * Default value to use for missing parts of the date when parsing keys.
 * For example, if the key is '2023-04-01-05', we want to set minutes, seconds, milliseconds to 0.
 */
const MISSING_PARTS_VALUE = 0;

/**
 * Gets dash separated storage key for the current date in UTC format.
 *
 * @example
 * ```ts
 * StatisticsStorage.dateToKey(); // 2025-05-19-12
 * StatisticsStorage.dateToKey(new Date('2023-04-01T12:00:00Z')); // 2023-04-01-12
 * ```
 *
 * @param date Date to convert. If not provided, current date is used.
 *
 * @returns Key of current date in UTC format.
 */
export function dateToKey(date = new Date()): string {
    return format(date, HOURLY_KEY_FORMAT, { in: utc });
}

/**
 * Converts a date key to a Date object.
 * The key should be in the format {@link HOURLY_KEY_FORMAT}.
 *
 * @example
 * ```ts
 * StatisticsStorage.keyToDate('2023-04-01-12'); // 2023-04-01T12:00:00.000Z
 * StatisticsStorage.keyToDate('2023-04-01-12-30'); // null
 * ```
 *
 * @param key Key to convert.
 *
 * @returns Date object or null if the key is not valid.
 */
export function keyToDate(key: string): Date | null {
    const date = parse(key, HOURLY_KEY_FORMAT, MISSING_PARTS_VALUE, { in: utc });

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

/**
 * Resets minutes, seconds, milliseconds to 0 for a given timestamp.
 *
 * @param timestamp Timestamp to crop.
 *
 * @returns Cropped timestamp.
 */
export function cropTimestampMinutes(timestamp: number): number {
    const date = new Date(timestamp);
    date.setUTCMinutes(0, 0, 0);
    return date.getTime();
}
