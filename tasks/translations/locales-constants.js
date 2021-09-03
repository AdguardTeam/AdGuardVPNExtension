import fs from 'fs';
import path from 'path';

import inputConfig from './config.json';

const {
    twosky_config_path: TWOSKY_CONFIG_PATH,
    api_url: API_URL,
    source_relative_path: SRC_RELATIVE_PATH,
    supported_source_filename_extensions: SRC_FILENAME_EXTENSIONS,
    persistent_messages: PERSISTENT_MESSAGES,
    locales_relative_path: LOCALES_RELATIVE_PATH,
    locales_data_format: FORMAT,
    locales_data_filename: LOCALE_DATA_FILENAME,
    required_locales: REQUIRED_LOCALES,
    threshold_percentage: THRESHOLD_PERCENTAGE,
} = inputConfig;

const twoskyPath = path.join(__dirname, TWOSKY_CONFIG_PATH);
const twoskyContent = fs.readFileSync(twoskyPath, { encoding: 'utf8' });
const twoskyConfig = JSON.parse(twoskyContent)[0];
const {
    base_locale: BASE_LOCALE,
    languages: LANGUAGES,
    project_id: PROJECT_ID,
} = twoskyConfig;

const LOCALES_ABSOLUTE_PATH = path.join(__dirname, LOCALES_RELATIVE_PATH);

export {
    BASE_LOCALE,
    LANGUAGES,
    PROJECT_ID,
    API_URL,
    SRC_RELATIVE_PATH,
    SRC_FILENAME_EXTENSIONS,
    PERSISTENT_MESSAGES,
    LOCALES_RELATIVE_PATH,
    LOCALES_ABSOLUTE_PATH,
    FORMAT,
    LOCALE_DATA_FILENAME,
    REQUIRED_LOCALES,
    THRESHOLD_PERCENTAGE,
};
