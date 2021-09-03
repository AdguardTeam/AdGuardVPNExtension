import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';

import {
    BASE_LOCALE,
    PROJECT_ID,
    API_URL,
    LOCALES_RELATIVE_PATH,
    FORMAT,
    LOCALE_DATA_FILENAME,
} from './locales-constants';

const API_UPLOAD_URL = `${API_URL}/upload`;
const LOCALES_DIR = path.resolve(__dirname, LOCALES_RELATIVE_PATH);

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
 * Entry point for uploading translations
 */
export const uploadBaseLocale = async () => {
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
};
