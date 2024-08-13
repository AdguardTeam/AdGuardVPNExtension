import _ from 'lodash';

import { validator } from '@adguard/translate';

import { cliLog, readMessagesByLocale, writeMessagesByLocale } from './helpers';
import {
    BASE_LOCALE,
    LANGUAGES,
    PERSISTENT_MESSAGES,
    REQUIRED_LOCALES,
    THRESHOLD_PERCENTAGE,
} from './locales-constants';

/**
 * Locales to be downloaded.
 */
const LOCALES = Object.keys(LANGUAGES);

/**
 * Marker for text max length in description.
 */
const TEXT_MAX_LENGTH_MARKER = 'TEXT MAX LENGTH:';

/**
 * @typedef Result
 * @property {string} locale
 * @property {string} level % of translated
 * @property {Array} untranslatedStrings
 * @property {Array} invalidTranslations
 */

/**
 * Logs translations readiness (default validation process)
 * @param {Result[]} results
 * @param {boolean} [isMinimum=false]
 */
const printTranslationsResults = (results, isMinimum = false) => {
    cliLog.info('Translations readiness:');
    results.forEach((res) => {
        const record = `${res.locale} -- ${res.level}%`;
        if (res.level < THRESHOLD_PERCENTAGE) {
            cliLog.error(record);
            if (res.untranslatedStrings.length > 0) {
                cliLog.warning('  untranslated:');
                res.untranslatedStrings.forEach((str) => {
                    cliLog.warning(`    - ${str}`);
                });
            }
            if (!isMinimum) {
                if (res.invalidTranslations.length > 0) {
                    cliLog.warning('  invalid:');
                    res.invalidTranslations.forEach((obj) => {
                        cliLog.warning(`    - ${obj.key} -- ${obj.error}`);
                    });
                }
            }
        } else {
            cliLog.success(record);
        }
    });
};

/**
 * Logs invalid translations (critical errors)
 * @param {Result[]} criticals
 */
const printCriticalResults = (criticals) => {
    cliLog.warning('Invalid translated string:');
    criticals.forEach((cr) => {
        cliLog.error(`${cr.locale}:`);
        cr.invalidTranslations.forEach((obj) => {
            cliLog.warning(`   - ${obj.key} -- ${obj.error}`);
        });
    });
};

/**
 * Validates the length of the translated string
 * against the `TEXT MAX LENGTH:` marker in the base description.
 *
 * @param {string} baseDescriptionValue Base description value.
 * @param {string} localeMessageValue Translated message value.
 *
 * @returns {string | null} Error message if the length is invalid, otherwise null.
 */
const validateTranslatedLength = (baseDescriptionValue, localeMessageValue) => {
    if (!baseDescriptionValue) {
        return null;
    }

    if (!baseDescriptionValue.includes(TEXT_MAX_LENGTH_MARKER)) {
        return null;
    }

    const markerIndex = baseDescriptionValue.indexOf(TEXT_MAX_LENGTH_MARKER);
    if (markerIndex === -1) {
        return null;
    }

    const lengthStr = baseDescriptionValue.slice(markerIndex + TEXT_MAX_LENGTH_MARKER.length).trim();
    const maxLength = Number(lengthStr);
    if (Number.isNaN(maxLength)) {
        return `Invalid max length value: ${lengthStr}`;
    }

    if (maxLength && localeMessageValue.length > maxLength) {
        return `Text length is more than allowed ${maxLength} characters, actual: ${localeMessageValue.length}`;
    }

    return null;
};

/**
 * Validates that localized string correspond by structure to base locale string.
 *
 * @param {string} baseKey Key of the base locale string.
 * @param {object} baseLocaleTranslations Translations of the base locale.
 * @param {string} locale Locale to validate.
 * @param {object} localeTranslations Translations of the locale to validate.
 *
 * @returns {object} Validation result if error occurred, otherwise undefined.
 */
const validateMessage = (baseKey, baseLocaleTranslations, locale, localeTranslations) => {
    const baseMessageValue = baseLocaleTranslations[baseKey].message;
    const baseDescriptionValue = baseLocaleTranslations[baseKey].description;
    const localeMessageValue = localeTranslations[baseKey].message;

    const lengthValidationError = validateTranslatedLength(baseDescriptionValue, localeMessageValue);
    if (lengthValidationError) {
        return {
            key: baseKey,
            error: lengthValidationError,
        };
    }

    let validation;
    try {
        if (!validator.isTranslationValid(
            baseMessageValue,
            localeMessageValue,
            // locale should be lowercase, e.g. 'pt_br', not 'pt_BR'
            // and with underscore, not dash, e.g. 'sr_latn', not 'sr-latn'
            locale.toLowerCase().replace('-', '_'),
        )) {
            throw new Error('Invalid translation');
        }
    } catch (error) {
        validation = { key: baseKey, error };
    }
    return validation;
};

/**
 * @typedef ValidationFlags
 * @property {boolean} [isMinimum=false] for minimum level of validation:
 * critical errors for all and full translations level for our locales
 * @property {boolean} [isInfo=false] for logging translations info without throwing the error
 */

/**
 * Checks locales translations readiness
 * @param {string[]} locales - list of locales
 * @param {ValidationFlags} flags
 * @returns {Result[]} array of object with such properties:
 * locale, level of translation readiness,
 * untranslated strings array and array of invalid translations
 */
export const checkTranslations = async (locales, flags) => {
    const { isMinimum = false, isInfo = false } = flags;
    const baseLocaleTranslations = await readMessagesByLocale(BASE_LOCALE);
    const baseMessages = Object.keys(baseLocaleTranslations);
    const baseMessagesCount = baseMessages.length;

    const translationResults = await Promise.all(locales.map(async (locale) => {
        const localeTranslations = await readMessagesByLocale(locale);
        const localeMessages = Object.keys(localeTranslations);
        const localeMessagesCount = localeMessages.length;

        const untranslatedStrings = [];
        const invalidTranslations = [];
        baseMessages.forEach((baseKey) => {
            if (!localeMessages.includes(baseKey)) {
                untranslatedStrings.push(baseKey);
            } else {
                const validationError = validateMessage(
                    baseKey,
                    baseLocaleTranslations,
                    locale,
                    localeTranslations,
                );
                if (validationError) {
                    invalidTranslations.push(validationError);
                }
            }
        });

        const validLocaleMessagesCount = localeMessagesCount - invalidTranslations.length;

        const strictLevel = ((validLocaleMessagesCount / baseMessagesCount) * 100);
        const level = Math.round((strictLevel + Number.EPSILON) * 100) / 100;

        return {
            locale, level, untranslatedStrings, invalidTranslations,
        };
    }));

    const filteredCriticalResults = translationResults.filter((result) => {
        return result.invalidTranslations.length > 0;
    });

    const filteredReadinessResults = translationResults.filter((result) => {
        return isMinimum
            ? result.level < THRESHOLD_PERCENTAGE && REQUIRED_LOCALES.includes(result.locale)
            : result.level < THRESHOLD_PERCENTAGE;
    });

    if (isInfo) {
        printTranslationsResults(translationResults);
    } else {
        // critical errors and required locales translations levels check
        if (isMinimum) {
            let isSuccess = true;
            // check for invalid strings
            if (filteredCriticalResults.length === 0) {
                cliLog.success('No invalid translations found');
            } else {
                isSuccess = false;
                printCriticalResults(filteredCriticalResults);
                cliLog.error('Locales above should not have invalid strings');
            }
            // check for translations readiness for required locales
            if (filteredReadinessResults.length === 0) {
                cliLog.success('Our locales have required level of translations');
            } else {
                isSuccess = false;
                printTranslationsResults(filteredReadinessResults, isMinimum);
                cliLog.error('Our locales should be done for 100%');
            }
            if (!isSuccess) {
                // throw error finally
                throw new Error('Locales validation failed!');
            }
        }
        // common translations check
        if (filteredReadinessResults.length === 0) {
            let message = `Level of translations is required for locales: ${locales.join(', ')}`;
            if (_.isEqual(locales, LOCALES)) {
                message = 'All locales have required level of translations';
            }
            cliLog.success(message);
        } else {
            printTranslationsResults(filteredReadinessResults);
            throw new Error('Locales above should be done for 100%');
        }
    }

    return translationResults;
};

/**
 * Adds required message from base locale if locale doesn't contains it
 * @param {string[]} locales
 */
export const addRequiredFields = async (locales) => {
    const nonBaseLocales = locales.filter((locale) => locale !== BASE_LOCALE);
    const requiredFields = PERSISTENT_MESSAGES;

    const baseLocaleMessages = await readMessagesByLocale(BASE_LOCALE);

    const result = await Promise.all(nonBaseLocales.map(async (locale) => {
        const localeMessages = await readMessagesByLocale(locale);
        const result = [];
        requiredFields.forEach((requiredField) => {
            if (!localeMessages?.[requiredField]) {
                result.push(`From base locale to ${locale} copied: "${requiredField}"`);
                localeMessages[requiredField] = baseLocaleMessages[requiredField];
            }
        });

        await writeMessagesByLocale(localeMessages, locale);

        return result.join('\n');
    }));

    return result.filter((i) => i).join('\n');
};
