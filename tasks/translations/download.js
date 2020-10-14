/* eslint-disable no-await-in-loop */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const querystring = require('querystring');

const { log } = require('./helpers');

const {
    TWOSKY_CONFIG_PATH,
    API_URL,
    LOCALES_RELATIVE_PATH,
    FORMAT,
    LOCALE_DATA_FILENAME,
} = require('./locales-constants');

const twoskyPath = path.join(__dirname, TWOSKY_CONFIG_PATH);
const twoskyContent = fs.readFileSync(twoskyPath, { encoding: 'utf8' });
const twoskyConfig = JSON.parse(twoskyContent)[0];
const { project_id: PROJECT_ID } = twoskyConfig;

const API_DOWNLOAD_URL = `${API_URL}/download`;
const LOCALES_DIR = path.resolve(__dirname, LOCALES_RELATIVE_PATH);

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
export const downloadAndSave = async (locales) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const lang of locales) {
        const downloadUrl = `${API_DOWNLOAD_URL}?${getQueryString(lang)}`;
        try {
            log.info(`Downloading: ${downloadUrl}`);
            const { data } = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
            const filePath = path.join(LOCALES_DIR, lang, LOCALE_DATA_FILENAME);
            await saveFile(filePath, data);
            log.info(`Successfully saved in: ${filePath}`);
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
};
