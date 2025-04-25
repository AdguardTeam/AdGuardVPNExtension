import browser from 'webextension-polyfill';

import { StatsRange } from '../../stores/StatsStore';

/**
 * Amount of bytes in a megabyte.
 */
const BYTES_IN_MB = 1024 * 1024;

/**
 * Amount of bytes in a gigabyte.
 */
const BYTES_IN_GB = 1024 * BYTES_IN_MB;

/**
 * Suffix for megabytes.
 */
const MB_SUFFIX = 'MB';

/**
 * Suffix for gigabytes.
 */
const GB_SUFFIX = 'GB';

/**
 * Download arrow character. Used as prefix for download bytes.
 */
const DOWNLOAD_PREFIX = '↓';

/**
 * Upload arrow character. Used as prefix for upload bytes.
 */
const UPLOAD_PREFIX = '↑';

/**
 * Formats the given number of bytes into a human-readable string (MB or GB).
 *
 * @param bytes The number of bytes to format.
 * @param includePrefixArrow Set to true if the prefix arrow should be included, false otherwise.
 * Use with `isDownload` parameter to determine the arrow direction.
 * @param isDownload Set to true if the bytes are download bytes, false if upload bytes.
 *
 * @returns A string representing the formatted bytes.
 */
export function formatBytes(
    bytes: number,
    includePrefixArrow = false,
    isDownload = false,
): string {
    let result = '';
    if (bytes >= BYTES_IN_GB) {
        const gb = bytes / BYTES_IN_GB;
        result = `${gb.toFixed(1)} ${GB_SUFFIX}`;
    } else {
        const mb = Math.floor(bytes / BYTES_IN_MB);
        result = `${mb} ${MB_SUFFIX}`;
    }

    if (!includePrefixArrow) {
        return result;
    }

    return `${isDownload ? DOWNLOAD_PREFIX : UPLOAD_PREFIX} ${result}`;
}

/**
 * Formats a date range string based on the given `StatsRange`.
 *
 * - If the range is `StatsRange.Hours24`, returns the todays date formatted.
 * - If the range is `StatsRange.Days7` or `StatsRange.Days30`, returns a formatted string
 *   representing the range from N days ago (inclusive) to today.
 *
 * Dates are formatted using the current browser UI language in the format:
 * `dd MMM yyyy` (e.g., `25 Apr 2025`).
 *
 * @param range The time range to format.
 *
 * @returns A string representing the formatted date range.
 */
export function getStatsRangeDates(range: StatsRange): string {
    const now = new Date();

    const formatter = new Intl.DateTimeFormat(browser.i18n.getUILanguage(), {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    const format = (date: Date) => formatter.format(date);

    if (range === StatsRange.Hours24) {
        return format(now);
    }

    const daysAgo = range === StatsRange.Days7 ? 7 : 30;
    const pastDate = new Date(now);

    // +1 because the range is inclusive
    pastDate.setDate(now.getDate() - daysAgo + 1);

    return `${format(pastDate)} - ${format(now)}`;
}
