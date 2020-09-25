/* eslint-disable no-console, no-await-in-loop */
require('@babel/register');

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const querystring = require('querystring');
const { program } = require('commander');
const chalk = require('chalk');

const { isTargetStrValid } = require('../../src/lib/translator/validator');

const {
    TWOSKY_CONFIG_PATH,
    API_URL,
    SRC_RELATIVE_PATH,
    SRC_FILENAME_EXTENSIONS,
    PERSISTENT_MESSAGES,
    LOCALES_RELATIVE_PATH,
    FORMAT,
    LOCALE_DATA_FILENAME,
    REQUIRED_LOCALES,
    THRESHOLD_PERCENTAGE,
} = require('./locales-constants');

const twoskyPath = path.join(__dirname, TWOSKY_CONFIG_PATH);
const twoskyContent = fs.readFileSync(twoskyPath, { encoding: 'utf8' });
const twoskyConfig = JSON.parse(twoskyContent)[0];
const {
    base_locale: BASE_LOCALE,
    project_id: PROJECT_ID,
    languages: LANGUAGES,
} = twoskyConfig;

const API_DOWNLOAD_URL = `${API_URL}/download`;
const API_UPLOAD_URL = `${API_URL}/upload`;
const LOCALES = Object.keys(LANGUAGES); // locales to be downloaded
const LOCALES_DIR = path.resolve(__dirname, LOCALES_RELATIVE_PATH);
const SRC_DIR = path.resolve(__dirname, SRC_RELATIVE_PATH);

/**
 * Build query string for downloading translations
 * @param {string} lang locale code
 */
const getQueryString = (lang) => querystring.stringify({
    format: FORMAT,
    language: lang,
    project: PROJECT_ID,
    filename: LOCALE_DATA_FILENAME,
});

/**
 * Build form data for uploading translation
 * @param {string} filePath
 */
const getFormData = (filePath) => {
    const formData = new FormData();

    formData.append('format', FORMAT);
    formData.append('language', BASE_LOCALE);
    formData.append('project', PROJECT_ID);
    formData.append('filename', LOCALE_DATA_FILENAME);
    formData.append('file', fs.createReadStream(filePath));

    return formData;
};

/**
 * Save file by path with passed content
 * @param {string} filePath path to file
 * @param {any} data arraybuffer
 */
function saveFile(filePath, data) {
    const formattedData = data.toString().trim();

    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
    }

    return fs.promises.writeFile(filePath, formattedData);
}

/**
 * Entry point for downloading translations
 */
async function downloadAndSave(locales) {
    // eslint-disable-next-line no-restricted-syntax
    for (const lang of locales) {
        const downloadUrl = `${API_DOWNLOAD_URL}?${getQueryString(lang)}`;
        try {
            console.log(`Downloading: ${downloadUrl}`);
            const { data } = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
            const filePath = path.join(LOCALES_DIR, lang, LOCALE_DATA_FILENAME);
            await saveFile(filePath, data);
            console.log(`Successfully saved in: ${filePath}`);
        } catch (e) {
            let errorMessage;
            if (e.response && e.response.data) {
                const decoder = new TextDecoder();
                errorMessage = decoder.decode(e.response.data);
            } else {
                errorMessage = e.message;
            }
            throw new Error(`Error occurred: ${errorMessage}, while downloading: ${downloadUrl}`);
        }
    }
}

/**
 * Entry point for uploading translations
 */
async function uploadBaseLocale() {
    const filePath = path.join(LOCALES_DIR, BASE_LOCALE, LOCALE_DATA_FILENAME);
    const formData = getFormData(filePath);
    let response;

    try {
        response = await axios.post(API_UPLOAD_URL, formData, {
            contentType: 'multipart/form-data',
            headers: formData.getHeaders(),
        });
    } catch (e) {
        throw new Error(`Error: ${e.message}, while uploading: ${API_UPLOAD_URL}`);
    }

    return response.data;
}

const log = {
    success: (str) => {
        console.log(chalk.green.bgBlack(str));
    },
    warning: (str) => {
        console.log(chalk.black.bgYellowBright(str));
    },
    error: (str) => {
        console.log(chalk.bold.yellow.bgRed(str));
    },
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
    console.log('Translations readiness:');
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
 * Compares two array
 * @param {Array} arr1
 * @param {Array} arr2
 * @returns {boolean}
 */
const isEqualArrays = (arr1, arr2) => {
    if (!arr1 || !arr2) {
        return false;
    }
    if (arr1.length !== arr2.length) {
        return false;
    }
    for (let i = 0; i < arr1.length; i += 1) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
};

const getLocaleMessages = async (locale) => {
    const filePath = path.join(LOCALES_DIR, locale, LOCALE_DATA_FILENAME);
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
};

/**
 * Function validates that localized strings correspond by structure to base locale
 * @returns {Promise<void>}
 */
const validateMessages = async (locales) => {
    console.log('Start messages validation');

    const baseMessages = await getLocaleMessages(BASE_LOCALE);

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
        const targetMessages = await getLocaleMessages(locale);
        const result = await validateTargetMessages(baseMessages, targetMessages, locale);
        return result;
    }));

    const notValid = results.filter((res) => !res.valid);

    if (notValid.length > 0) {
        const errorMessage = notValid.map((res) => res.error).join('\n');
        console.log(errorMessage);
        throw new Error('Messages are not valid');
    }

    log.success('AST structures of translations are valid');
};

/**
 * Checks locales translations readiness
 * @param {Array} locales list of locales to check
 * @param {boolean} [isInfo=false] flag for info script
 * @returns {Result[]} array of object with such properties:
 * locale, level of translation readiness and untranslated strings array
 */
const checkTranslations = async (locales, isInfo = false) => {
    const baseLocaleTranslations = await getLocaleMessages(BASE_LOCALE);
    const baseMessages = Object.keys(baseLocaleTranslations);
    const baseMessagesCount = baseMessages.length;

    const results = await Promise.all(locales.map(async (locale) => {
        const localeTranslations = await getLocaleMessages(locale);
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
        if (isEqualArrays(locales, LOCALES)) {
            message = 'All locales have required level of translations';
        } else if (isEqualArrays(locales, REQUIRED_LOCALES)) {
            message = 'Our locales have required level of translations';
        }
        log.success(message);
    } else {
        printTranslationsResults(filteredResults);
        throw new Error('Locales above should be done for 100%');
    }

    return results;
};

/**
 * Checks file extension is it one of source files
 * @param {string} filePath path to file
 * @returns {boolean}
 */
const canContainLocalesStrings = (filePath) => {
    let isSrcFile = false;
    for (let i = 0; i < SRC_FILENAME_EXTENSIONS.length; i += 1) {
        isSrcFile = filePath.endsWith(SRC_FILENAME_EXTENSIONS[i]) || isSrcFile;

        if (isSrcFile) {
            break;
        }
    }

    return isSrcFile && !filePath.includes(LOCALES_DIR);
};

/**
 * Collects contents of source files in given directory
 * @param {string} dirPath path to dir
 * @param {Array} [contents=[]] result acc
 * @returns {Array}
 */
const getSrcFilesContents = (dirPath, contents = []) => {
    fs.readdirSync(dirPath).forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.lstatSync(fullPath).isDirectory()) {
            getSrcFilesContents(fullPath, contents);
        } else if (canContainLocalesStrings(fullPath)) {
            contents.push(fs.readFileSync(fullPath).toString());
        }
    });
    return contents;
};

/**
 * Checks if there are unused base-locale strings in source files
 * @param {boolean} [isInfo=false]
 */
const checkUnusedMessages = async (isInfo = false) => {
    const baseLocaleTranslations = await getLocaleMessages(BASE_LOCALE);
    const baseMessages = Object.keys(baseLocaleTranslations);

    const filesContents = getSrcFilesContents(SRC_DIR);

    const isUsed = (message, file) => {
        return file.includes(`'${message}'`) || file.includes(`"${message}"`);
    };

    const unused = [];
    baseMessages.forEach((message) => {
        if (PERSISTENT_MESSAGES.includes(message)) {
            return;
        }
        if (!filesContents.some((file) => isUsed(message, file))) {
            unused.push(message);
        }
    });

    if (unused.length === 0) {
        log.success('There are no unused messages');
    } else {
        log.warning('Unused messages:');
        unused.forEach((key) => {
            log.warning(`  ${key}`);
        });
        if (!isInfo) {
            throw new Error('There should be no unused messages');
        }
    }
};

const download = async (locales) => {
    try {
        await downloadAndSave(locales);
        log.success('Download was successful');
        await validateMessages(locales);
        await checkTranslations(REQUIRED_LOCALES);
    } catch (e) {
        console.log(e.message);
        process.exit(1);
    }
};

const upload = async () => {
    try {
        const result = await uploadBaseLocale();
        console.log(`Upload was successful with response: ${JSON.stringify(result)}`);
    } catch (e) {
        console.log(e.message);
        process.exit(1);
    }
};

const validate = async (locales) => {
    try {
        await validateMessages(locales);
        await checkTranslations(REQUIRED_LOCALES);
    } catch (e) {
        console.log(e.message);
        process.exit(1);
    }
};

const summary = async (isInfo) => {
    try {
        await checkTranslations(LOCALES, isInfo);
    } catch (e) {
        console.log(e.message);
        process.exit(1);
    }
};

const unused = async (isInfo) => {
    try {
        await checkUnusedMessages(isInfo);
    } catch (e) {
        console.log(e.message);
        process.exit(1);
    }
};

program
    .command('download')
    .description('Downloads messages from localization service')
    .option('-l,--locales [list...]', 'specific list of space-separated locales')
    .action((opts) => {
        const locales = opts.locales && opts.locales.length > 0 ? opts.locales : LOCALES;
        download(locales);
    });

program
    .command('upload')
    .description('Uploads base messages to the localization service')
    .action(upload);

program
    .command('validate')
    .description('Validates translations')
    .option('-R,--min', 'for only our required locales')
    .option('-l,--locales [list...]', 'for specific list of space-separated locales')
    .action((opts) => {
        let locales;
        if (opts.min) {
            locales = REQUIRED_LOCALES;
        } else if (opts.locales && opts.locales.length > 0) {
            locales = opts.locales;
        } else {
            // defaults to validate all locales
            locales = LOCALES;
        }
        validate(locales);
    });

program
    .command('info')
    .description('Shows locales info')
    .option('-s,--summary', 'for all locales translations readiness')
    .option('-N,--unused', 'for unused base-lang strings')
    .action((opts) => {
        const IS_INFO = true;
        if (opts.summary) {
            summary(IS_INFO);
        } else if (opts.unused) {
            unused(IS_INFO);
        } else if (!opts.summary && !opts.unused) {
            summary(IS_INFO);
            unused(IS_INFO);
        }
    });

program.parse(process.argv);
