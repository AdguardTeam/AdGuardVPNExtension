import path from 'path';

import dotenv from 'dotenv';

// Retrieves config from .env file and assigns it to the process.env
dotenv.config();

export const SRC_PATH = '../src';

export enum Env {
    Dev = 'dev',
    Beta = 'beta',
    Release = 'release',
}

export enum Browser {
    Chrome = 'chrome',
    Firefox = 'firefox',
    Edge = 'edge',
    Opera = 'opera',
}

// Used only to change output filenames
export enum StageEnv {
    Test = 'test',
    Prod = 'prod',
}

type EnvMap = {
    [key: string]: {
        outputPath: string,
        name: string,
    },
};

export const BUILD_ENV_MAP: EnvMap = {
    [Env.Dev]: { outputPath: 'dev', name: 'Dev' },
    [Env.Beta]: { outputPath: 'beta', name: 'Beta' },
    [Env.Release]: { outputPath: 'release', name: '' },
};

export const GECKO_ID_ENV_MAP = {
    [Env.Dev]: 'adguard-vpn-dev@adguard.com',
    [Env.Beta]: 'adguard-vpn-beta@adguard.com',
    [Env.Release]: 'adguard-vpn@adguard.com',
};

/**
 * Minimum supported browser versions.
 *
 * IMPORTANT! Update browser compatibility in the README.md file when changing the versions.
 */
export const MIN_SUPPORTED_VERSION = {
    CHROMIUM: 109,
    FIREFOX: 115,
};

export const { BUILD_ENV, STAGE_ENV } = process.env;

export const IS_DEV = BUILD_ENV ? BUILD_ENV === Env.Dev : true;

export const IS_BETA = BUILD_ENV ? BUILD_ENV === Env.Beta : false;

// Build output path
export const BUILD_PATH = '../build';
export const CRX_NAME = 'chrome.crx';
export const CRX_PROD_NAME = 'chrome-prod.crx';
export const XPI_NAME = 'firefox.xpi';
export const CHROME_UPDATER_FILENAME = 'update.xml';
export const FIREFOX_UPDATER_FILENAME = 'update.json';
export const MANIFEST_NAME = 'manifest.json';

// Chrome CRX certificate paths
export const CERTIFICATE_PATHS = {
    [Env.Dev]: './tests/certificate-test.pem',
    [Env.Beta]: './private/AdguardVPN/certificate-beta.pem',
    [Env.Release]: './private/AdguardVPN/certificate-release.pem',
};

export const DEPLOY_PATH = process.env.BUILD_ENV || Env.Dev;

export const UPDATE_BASE_URL = 'https://static.adtidy.net/extensions/adguardvpn';

/**
 * Update manifest URL for the Chrome extension
 */
export const CHROME_UPDATE_URL = `${UPDATE_BASE_URL}/${DEPLOY_PATH}/${CHROME_UPDATER_FILENAME}`;

/**
 * Update manifest URL for the Firefox add-on
 */
export const FIREFOX_UPDATE_URL = `${UPDATE_BASE_URL}/${DEPLOY_PATH}/${FIREFOX_UPDATER_FILENAME}`;

/**
 * URL to the Chrome CRX (that we'll add to the update manifest)
 */
export const CHROME_UPDATE_CRX = `${UPDATE_BASE_URL}/${DEPLOY_PATH}/${CRX_NAME}`;

/**
 * URL to the Firefox XPI (that we'll add to the update manifest)
 */
export const FIREFOX_UPDATE_XPI = `${UPDATE_BASE_URL}/${DEPLOY_PATH}/${XPI_NAME}`;

/**
 * Path to update.json template
 */
export const FIREFOX_UPDATE_TEMPLATE_PATH = path.resolve(__dirname, './firefox/update_template.json');
