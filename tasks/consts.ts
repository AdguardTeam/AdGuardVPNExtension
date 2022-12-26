import dotenv from 'dotenv';

// Retrieves config from .env file and assigns it to the process.env
dotenv.config();

export const SRC_PATH = '../src';
export const ENVS = {
    DEV: 'dev',
    BETA: 'beta',
    RELEASE: 'release',
};

export const BROWSERS = {
    CHROME: 'chrome',
    CHROME_MV3: 'chrome-mv3',
    FIREFOX: 'firefox',
    EDGE: 'edge',
    OPERA: 'opera',
};

// Used only to change output filenames
export const STAGE_ENVS = {
    TEST: 'test',
    PROD: 'prod',
};

type EnvMap = {
    [key: string]: {
        outputPath: string,
        name: string,
    },
};

export const ENV_MAP: EnvMap = {
    [ENVS.DEV]: { outputPath: 'dev', name: 'Dev' },
    [ENVS.BETA]: { outputPath: 'beta', name: 'Beta' },
    [ENVS.RELEASE]: { outputPath: 'release', name: '' },
};

export const { BUILD_ENV, STAGE_ENV } = process.env;

export const IS_DEV = BUILD_ENV ? BUILD_ENV === ENVS.DEV : true;

// Build output path
export const BUILD_PATH = '../build';
export const CRX_NAME = 'chrome.crx';
export const CRX_MV3_NAME = 'chrome-mv3.crx';
export const XPI_NAME = 'firefox.xpi';
export const CHROME_UPDATER_FILENAME = 'update.xml';
export const FIREFOX_UPDATER_FILENAME = 'update.json';
export const MANIFEST_NAME = 'manifest.json';

export const MV3 = 'mv3';

// Chrome CRX certificate paths
export const CERTIFICATE_PATHS = {
    beta: './private/AdguardVPN/certificate-beta.pem',
    release: './private/AdguardVPN/certificate-release.pem',
};

export const deployPath = process.env.BUILD_ENV || ENVS.DEV;

// Update manifest URL for the Chrome extension
export const CHROME_UPDATE_URL = `https://static.adguardvpn.com/extensions/adguardvpn/${deployPath}/${CHROME_UPDATER_FILENAME}`;

// Update manifest URL for the Firefox add-on
export const FIREFOX_UPDATE_URL = `https://static.adguardvpn.com/extensions/adguardvpn/${deployPath}/${FIREFOX_UPDATER_FILENAME}`;

// Path to the Chrome CRX (that we'll add to the update manifest)
export const CHROME_UPDATE_CRX = `https://static.adguardvpn.com/extensions/adguardvpn/${deployPath}/${CRX_NAME}`;

// Path to the Firefox XPI (that we'll add to the update manifest)
export const FIREFOX_UPDATE_XPI = `https://static.adguardvpn.com/extensions/adguardvpn/${deployPath}/${XPI_NAME}`;
