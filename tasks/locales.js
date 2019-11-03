/* eslint-disable no-console, no-await-in-loop */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const querystring = require('querystring');
const twoskyConfig = require('../.twosky.json')[0];

const {
    project_id: PROJECT_ID, languages: LANGUAGES, base_locale: BASE_LOCALE,
} = twoskyConfig;

const BASE_URL = 'https://twosky.adtidy.org/api/v1';
const BASE_DOWNLOAD_URL = `${BASE_URL}/download`;
const BASE_UPLOAD_URL = `${BASE_URL}/upload`;
const FORMAT = 'json';
const FILENAME = `messages.${FORMAT}`;
const LOCALES = Object.keys(LANGUAGES); // locales to be downloaded
const LOCALES_DIR = path.resolve(__dirname, '../src/_locales');

/**
 * Build query string for downloading translations
 * @param {string} lang locale code
 */
const getQueryString = lang => querystring.stringify({
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
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
    }
    return fs.promises.writeFile(filePath, data);
}

/**
 * Entry point for downloading translations
 */
async function downloadAndSave() {
    // eslint-disable-next-line guard-for-in,no-restricted-syntax
    for (const lang of LOCALES) {
        const downloadUrl = `${BASE_DOWNLOAD_URL}?${getQueryString(lang)}`;
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
async function upload() {
    const filePath = path.join(LOCALES_DIR, BASE_LOCALE, FILENAME);
    const formData = getFormData(filePath);
    let response;

    try {
        response = await axios.post(BASE_UPLOAD_URL, formData, {
            contentType: 'multipart/form-data',
            headers: formData.getHeaders(),
        });
    } catch (e) {
        throw new Error(`Error: ${e.message}, while uploading: ${BASE_UPLOAD_URL}`);
    }

    return response.data;
}

/**
 * You need set environment variable LOCALES=DOWNLOAD|UPLOAD when run the script
 */
if (process.env.LOCALES === 'DOWNLOAD') {
    downloadAndSave()
        .then(() => {
            console.log('Download was successful');
        })
        .catch((e) => {
            console.log(e.message);
            process.exit(1);
        });
} else if (process.env.LOCALES === 'UPLOAD') {
    upload()
        .then((result) => {
            console.log(`Upload was successful with response: ${JSON.stringify(result)}`);
        })
        .catch((e) => {
            console.log(e.message);
            process.exit(1);
        });
} else {
    console.log('Option DOWNLOAD/UPLOAD locales is not set');
}
