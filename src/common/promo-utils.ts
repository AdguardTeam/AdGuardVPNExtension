import browser from 'webextension-polyfill';

import {
    ONE_SECOND_MS,
    ONE_MINUTE_MS,
    ONE_HOUR_MS,
    ONE_DAY_MS,
} from './constants';

const RU_LOCALE = 'ru';

/**
 * Normalizes browser locale by converting it to lower case and replacing dash with underscore.
 *
 * @param locale Current browser locale.
 *
 * @returns Normalized locale.
 */
export const normalizeLanguage = (locale: string): string | null => {
    if (!locale) {
        return null;
    }

    return locale.toLowerCase().replace('-', '_');
};

const currentLocale = normalizeLanguage(browser.i18n.getUILanguage());

export const isRuLocale = currentLocale?.startsWith(RU_LOCALE);

/**
 * Formats number into two digit string.
 *
 * @param num Number to format.
 *
 * @returns Formatted string.
 *
 * @example
 * 0 -> '00'
 * 4 -> '04'
 * 10 -> '10'
 * 22 -> '22'
 */
const formatTwoDigitString = (num: number): string => {
    return String(num).padStart(2, '0');
};

/**
 * Converts timestamp in milliseconds to time string.
 *
 * @param timestampMs Timestamp in milliseconds.
 *
 * @returns Time string in format `HH:MM:SS`.
 */
export const timestampMsToTimeString = (timestampMs: number): string => {
    const hours = formatTwoDigitString(Math.floor((timestampMs % ONE_DAY_MS) / ONE_HOUR_MS));
    const minutes = formatTwoDigitString(Math.floor((timestampMs % ONE_HOUR_MS) / ONE_MINUTE_MS));
    const seconds = formatTwoDigitString(Math.floor((timestampMs % ONE_MINUTE_MS) / ONE_SECOND_MS));

    return `${hours}:${minutes}:${seconds}`;
};
