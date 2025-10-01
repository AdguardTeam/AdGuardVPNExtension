import browser from 'webextension-polyfill';

import { StatisticsRange } from '../../../background/statistics/statisticsTypes';
import { translator } from '../../../common/translator';
import { formatBytes } from '../../../common/helpers';
import { ONE_DAY_MS, ONE_HOUR_MS, ONE_MINUTE_MS } from '../../../common/constants';

/**
 * Amount of bytes in a megabyte.
 */
export const MEGABYTE_BYTES = 1024 * 1024;

/**
 * Amount of bytes in a gigabyte.
 */
const GIGABYTE_BYTES = 1024 * MEGABYTE_BYTES;

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
 * @example
 * ```ts
 * formatTraffic(789_000_000); // '752 MB'
 * formatTraffic(4_200_000_000); // '3.9 GB'
 * formatTraffic(789_000_000, true, false); // '↑ 752 MB'
 * formatTraffic(4_200_000_000, true, true); // '↓ 3.9 GB'
 * ```
 *
 * @param bytes The number of bytes to format.
 * @param includePrefixArrow Set to true if the prefix arrow should be included, false otherwise.
 * Use with `isDownload` parameter to determine the arrow direction.
 * @param isDownload Set to true if the bytes are download bytes, false if upload bytes.
 *
 * @returns A string representing the formatted bytes.
 */
export function formatTraffic(
    bytes: number,
    includePrefixArrow = false,
    isDownload = false,
): string {
    let formatted: ReturnType<typeof formatBytes>;

    // If the bytes are less than 1 MB, we set the value to 0 and the unit to MB
    if (bytes < MEGABYTE_BYTES) {
        formatted = { value: '0', unit: 'MB' };
    } else {
        const decimals = bytes >= GIGABYTE_BYTES ? 1 : 0;
        formatted = formatBytes(bytes, decimals);
    }

    const result = `${formatted.value} ${formatted.unit}`;

    if (!includePrefixArrow) {
        return result;
    }

    return `${isDownload ? DOWNLOAD_PREFIX : UPLOAD_PREFIX} ${result}`;
}

/**
 * Formats the given time in milliseconds into a human-readable string (translated).
 *
 * @example
 * ```ts
 * // Locale is set to 'en-US'
 * formatDuration(0); // '0m'
 * formatDuration(60_000); // '1m'
 * formatDuration(3_600_000); // '1h 0m'
 * formatDuration(3_600_000 + 60_000); // '1h 1m'
 * formatDuration(86_400_000); // '1d 0h 0m'
 * formatDuration(86_400_000 + 3_600_000); // '1d 1h 0m'
 * formatDuration(86_400_000 + 3_600_000 + 60_000); // '1d 1h 1m'
 * ```
 *
 * @param timeMs The time in milliseconds to format.
 *
 * @returns A string representing the formatted time.
 */
export function formatDuration(timeMs: number): string {
    const days = Math.floor(timeMs / ONE_DAY_MS);
    const hours = Math.floor((timeMs % ONE_DAY_MS) / ONE_HOUR_MS);
    const minutes = Math.floor((timeMs % ONE_HOUR_MS) / ONE_MINUTE_MS);

    /**
     * Replace the spaces with an empty string of each chunk, this space is added
     * to avoid false variable determination in crowdin
     */

    const minutesString = translator.getMessage('popup_stats_connection_to_vpn_minutes', { minutes }).replace(/\s+/, '');
    let result = minutesString;

    if (days > 0 || hours > 0) {
        const hoursString = translator.getMessage('popup_stats_connection_to_vpn_hours', { hours }).replace(/\s+/, '');
        result = `${hoursString} ${result}`;
    }

    if (days > 0) {
        const daysString = translator.getMessage('popup_stats_connection_to_vpn_days', { days }).replace(/\s+/, '');
        result = `${daysString} ${result}`;
    }

    return result;
}

/**
 * Return type for {@link formatRange} function.
 */
export interface FormattedRangeDates {
    /**
     * Formatted start date string.
     */
    start: string;

    /**
     * Formatted end date string.
     */
    end: string;
}

/**
 * Two-way date ranges that show start and end dates.
 */
type TwoWayRanges = StatisticsRange.Hours24 | StatisticsRange.Days7 | StatisticsRange.Days30;

/**
 * Formats a two-way date range (start – end) for the given range and first stats date.
 * When both dates are in the same month, the month name is not duplicated.
 * Dates are formatted using the current browser UI language.
 *
 * @example
 * ```ts
 * // Locale is set to 'en-US'
 * formatRange(StatisticsRange.Days7, firstStatsDate); // '06 – 12 May'
 * formatRange(StatisticsRange.Days30, firstStatsDate); // 'Apr 13 – May 12'
 * ```
 *
 * @param range Range to use for formatting.
 *
 * @returns Object with formatted start and end date strings.
 */
export function formatRange(range: TwoWayRanges): FormattedRangeDates {
    const locale = browser.i18n.getUILanguage();

    const formatter = new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
    });

    const now = new Date();
    const format = (date: Date): string => formatter.format(date);

    let pastDate: Date;
    switch (range) {
        case StatisticsRange.Hours24:
            pastDate = new Date(now);
            pastDate.setHours(now.getHours() - 24);
            break;
        case StatisticsRange.Days7:
        case StatisticsRange.Days30:
            pastDate = new Date(now);
            // +1 because the range is inclusive
            pastDate.setDate(now.getDate() - (range === StatisticsRange.Days7 ? 7 : 30) + 1);
            break;
        default:
            throw new Error('Invalid range');
    }

    const isSameMonth = pastDate.getMonth() === now.getMonth() && pastDate.getFullYear() === now.getFullYear();

    // We should show the month only once if it's same month.
    if (isSameMonth) {
        const dayFormatter = new Intl.DateTimeFormat(locale, { day: '2-digit' });
        const endDayFormatter = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' });
        return {
            start: dayFormatter.format(pastDate),
            end: endDayFormatter.format(now),
        };
    }

    return {
        start: format(pastDate),
        end: format(now),
    };
}

/**
 * Formats a "since" date for AllTime statistics range.
 *
 * @example
 * ```ts
 * // Locale is set to 'en-US'
 * formatSinceDate(firstStatsDate); // '19 Sep 2024'
 * ```
 *
 * @param startDate Date to format.
 *
 * @returns the formatted start date using the current browser UI language.
 */
export function formatSinceDate(startDate: Date): string {
    const locale = browser.i18n.getUILanguage();
    const formatter = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' });

    return formatter.format(startDate);
}
