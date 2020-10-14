const fs = require('fs');
const path = require('path');

const { isTargetStrValid } = require('../../src/lib/translator/validator');

const { log, getLocaleMessages, areArraysEqual } = require('./helpers');

const {
    TWOSKY_CONFIG_PATH,
    LOCALES_RELATIVE_PATH,
    LOCALE_DATA_FILENAME,
    REQUIRED_LOCALES,
    THRESHOLD_PERCENTAGE,
} = require('./locales-constants');

const twoskyPath = path.join(__dirname, TWOSKY_CONFIG_PATH);
const twoskyContent = fs.readFileSync(twoskyPath, { encoding: 'utf8' });
const twoskyConfig = JSON.parse(twoskyContent)[0];
const {
    base_locale: BASE_LOCALE,
    languages: LANGUAGES,
} = twoskyConfig;

const LOCALES = Object.keys(LANGUAGES); // locales to be downloaded
const LOCALES_DIR = path.resolve(__dirname, LOCALES_RELATIVE_PATH);

/**
 * Function validates that localized strings correspond by structure to base locale
 * @returns {Promise<void>}
 */
export const validateMessages = async (locales) => {
    log.info('Start messages validation');

    const baseMessages = await getLocaleMessages(LOCALES_DIR, BASE_LOCALE, LOCALE_DATA_FILENAME);

    const localesWithoutBase = locales.filter((locale) => locale !== BASE_LOCALE);

    const validateTargetMessages = async (baseMessages, targetMessages, targetLocale) => {
        const results = Object.keys(targetMessages).map((key) => {
            const baseMessage = baseMessages[key].message;
            const targetMessage = targetMessages[key].message;
            const valid = isTargetStrValid(baseMessage, targetMessage);
            if (valid) {
                return { valid: true };
            }
            return { valid: false, error: `Message "${key}" locale is not valid` };
        });

        const errors = results
            .filter((res) => !res.valid)
            .map((res) => res.error);

        if (errors.length > 0) {
            let message = `Locale "${targetLocale}" is NOT valid because of next messages:\n`;
            message += errors.join('\n');
            return { valid: false, error: message };
        }

        return { valid: true };
    };

    const results = await Promise.all(localesWithoutBase.map(async (locale) => {
        const targetMessages = await getLocaleMessages(LOCALES_DIR, locale, LOCALE_DATA_FILENAME);
        const result = await validateTargetMessages(baseMessages, targetMessages, locale);
        return result;
    }));

    const notValid = results.filter((res) => !res.valid);

    if (notValid.length > 0) {
        const errorMessage = notValid.map((res) => res.error).join('\n');
        log.error(errorMessage);
        throw new Error('Messages are not valid');
    }

    log.success('AST structures of translations are valid');
};

/**
 * @typedef Result
 * @property {string} locale
 * @property {string} level % of translated
 * @property {Array} untranslatedStrings
 */

/**
 * Logs translations readiness
 * @param {Result[]} results
 */
const printTranslationsResults = (results) => {
    log.info('Translations readiness:');
    results.forEach((res) => {
        const record = `${res.locale} -- ${res.level}%`;
        if (res.level < THRESHOLD_PERCENTAGE) {
            log.error(record);
            res.untranslatedStrings.forEach((str) => {
                log.warning(`  ${str}`);
            });
        } else {
            log.success(record);
        }
    });
};

/**
 * Checks locales translations readiness
 * @param {string[]} locales - list of locales
 * @param {boolean} [isInfo=false] flag for info script
 * @returns {Result[]} array of object with such properties:
 * locale, level of translation readiness and untranslated strings array
 */
export const checkTranslations = async (locales, isInfo = false) => {
    const baseLocaleTranslations = await getLocaleMessages(
        LOCALES_DIR, BASE_LOCALE, LOCALE_DATA_FILENAME
    );
    const baseMessages = Object.keys(baseLocaleTranslations);
    const baseMessagesCount = baseMessages.length;

    const results = await Promise.all(locales.map(async (locale) => {
        const localeTranslations = await getLocaleMessages(
            LOCALES_DIR, locale, LOCALE_DATA_FILENAME
        );
        const localeMessages = Object.keys(localeTranslations);
        const localeMessagesCount = localeMessages.length;

        const strictLevel = ((localeMessagesCount / baseMessagesCount) * 100);
        const level = Math.round((strictLevel + Number.EPSILON) * 100) / 100;

        const untranslatedStrings = [];
        baseMessages.forEach((baseStr) => {
            if (!localeMessages.includes(baseStr)) {
                untranslatedStrings.push(baseStr);
            }
        });

        return { locale, level, untranslatedStrings };
    }));

    const filteredResults = results.filter((result) => {
        return result.level < THRESHOLD_PERCENTAGE;
    });

    if (isInfo) {
        printTranslationsResults(results);
    } else if (filteredResults.length === 0) {
        let message = `Level of translations is required for locales: ${locales.join(', ')}`;
        if (areArraysEqual(locales, LOCALES)) {
            message = 'All locales have required level of translations';
        } else if (areArraysEqual(locales, REQUIRED_LOCALES)) {
            message = 'Our locales have required level of translations';
        }
        log.success(message);
    } else {
        printTranslationsResults(filteredResults);
        throw new Error('Locales above should be done for 100%');
    }

    return results;
};
