/* eslint-disable no-console, no-await-in-loop */
require('@babel/register');

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const querystring = require('querystring');
const { program } = require('commander');

const twoskyConfig = require('../../.twosky.json')[0];
const { isTargetStrValid } = require('../../src/lib/translator/validator');

const {
    project_id: PROJECT_ID, languages: LANGUAGES, base_locale: BASE_LOCALE,
} = twoskyConfig;

const API_URL = 'https://twosky.adtidy.org/api/v1';
const API_DOWNLOAD_URL = `${API_URL}/download`;
const API_UPLOAD_URL = `${API_URL}/upload`;
const FORMAT = 'chrome';
const FILENAME = 'messages.json';
const LOCALES = Object.keys(LANGUAGES); // locales to be downloaded
const LOCALES_DIR = path.resolve(__dirname, '../src/_locales');

/**
 * Build query string for downloading translations
 * @param {string} lang locale code
 */
const getQueryString = (lang) => querystring.stringify({
    format: FORMAT,
    language: lang,
    project: PROJECT_ID,
    filename: FILENAME,
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
    formData.append('filename', FILENAME);
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
async function downloadAndSave() {
    // eslint-disable-next-line guard-for-in,no-restricted-syntax
    for (const lang of LOCALES) {
        const downloadUrl = `${API_DOWNLOAD_URL}?${getQueryString(lang)}`;
        try {
            console.log(`Downloading: ${downloadUrl}`);
            const { data } = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
            const filePath = path.join(LOCALES_DIR, lang, FILENAME);
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
    const filePath = path.join(LOCALES_DIR, BASE_LOCALE, FILENAME);
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

/**
 * Function validates that localized strings correspond by structure to base locale
 * @returns {Promise<void>}
 */
const validateMessages = async () => {
    console.log('Start messages validation');

    async function getLocaleMessages(locale) {
        const targetMessagesPath = path.join(LOCALES_DIR, locale, FILENAME);
        const targetMessagesData = await fs.promises.readFile(targetMessagesPath, 'utf8');
        const targetMessages = JSON.parse(targetMessagesData);
        return targetMessages;
    }

    const baseMessages = await getLocaleMessages(BASE_LOCALE);

    const localesWithoutBase = LOCALES.filter((locale) => locale !== BASE_LOCALE);

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

    console.log('Validated successfully');
};

const validate = async () => {
    try {
        await validateMessages();
    } catch (e) {
        console.log(e.message);
        process.exit(1);
    }
};

const download = async () => {
    try {
        await downloadAndSave();
        console.log('Download was successful');
        await validateMessages();
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

program
    .command('validate')
    .description('Validates messages in locales')
    .action(validate);

program
    .command('download')
    .description('Downloads messages from localization service')
    .action(download);

program
    .command('upload')
    .description('Uploads base messages to the localization service')
    .action(upload);

program.parse(process.argv);
