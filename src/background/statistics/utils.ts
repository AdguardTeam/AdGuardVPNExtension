/**
 * Separator for statistics storage keys.
 */
export const STATISTICS_DATE_SEPARATOR = '-';

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
    const parts = [
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate(),
    ];

    if (includeHours) {
        parts.push(date.getUTCHours());
    }

    return parts
        .map((part) => String(part).padStart(2, '0'))
        .join(STATISTICS_DATE_SEPARATOR);
}

/**
 * Converts a date key to a Date object.
 * The key should be in the format `'YYYY-MM-DD'` or `'YYYY-MM-DD-HH'`.
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
    const parts = key
        .split(STATISTICS_DATE_SEPARATOR)
        .map((part) => parseInt(part, 10));

    // Validate the parts
    if (parts.length < 3 || parts.length > 4 || parts.some((part) => Number.isNaN(part))) {
        return null;
    }

    const [year, month, day, hour = 0] = parts;

    const date = new Date(Date.UTC(year, month - 1, day, hour));

    // Check if the date is valid
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}
