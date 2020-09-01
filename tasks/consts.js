const path = require('path');

const SRC_PATH = '../src';
const LOCALES_PATH = path.join(__dirname, SRC_PATH, '_locales/en/messages');

const ENVS = {
    DEV: 'dev',
    BETA: 'beta',
    RELEASE: 'release',
};

const BROWSERS = {
    CHROME: 'chrome',
    FIREFOX: 'firefox',
};

const PROD_ENVS = {
    TEST: 'test',
    PROD: 'prod',
};

const ENV_MAP = {
    [ENVS.DEV]: { outputPath: 'dev', name: 'Dev' },
    [ENVS.BETA]: { outputPath: 'beta', name: 'Beta' },
    [ENVS.RELEASE]: { outputPath: 'release', name: '' },
};

const { BUILD_ENV } = process.env;
let { PROD_ENV } = process.env;
if (!PROD_ENV) {
    PROD_ENV = BUILD_ENV === ENVS.DEV ? 'test' : 'prod';
}

const IS_DEV = BUILD_ENV ? BUILD_ENV === ENVS.DEV : true;

// Build output path
const BUILD_PATH = '../build';
const CRX_NAME = 'chrome.crx';
const XPI_NAME = 'firefox.xpi';
const CHROME_UPDATER_FILENAME = 'update.xml';
const FIREFOX_UPDATER_FILENAME = 'update.json';
const MANIFEST_NAME = 'manifest.json';

// Chrome CRX certificate paths
const CERTIFICATE_PATHS = {
    beta: './private/AdguardVPN/certificate-beta.pem',
    release: './private/AdguardVPN/certificate-release.pem',
};

const deployPath = process.env.BUILD_ENV || ENVS.DEV;

// Update manifest URL for the Chrome extension
const CHROME_UPDATE_URL = `https://static.adguard.com/extensions/adguardvpn/${deployPath}/${CHROME_UPDATER_FILENAME}`;

// Update manifest URL for the Firefox add-on
const FIREFOX_UPDATE_URL = `https://static.adguard.com/extensions/adguardvpn/${deployPath}/${FIREFOX_UPDATER_FILENAME}`;

// Path to the Chrome CRX (that we'll add to the update manifest)
const CHROME_UPDATE_CRX = `https://static.adguard.com/extensions/adguardvpn/${deployPath}/${CRX_NAME}`;

// Path to the Firefox XPI (that we'll add to the update manifest)
const FIREFOX_UPDATE_XPI = `https://static.adguard.com/extensions/adguardvpn/${deployPath}/${XPI_NAME}`;

module.exports = {
    LOCALES_PATH,
    ENV_MAP,
    SRC_PATH,
    IS_DEV,
    ENVS,
    BUILD_ENV,
    BUILD_PATH,
    CERTIFICATE_PATHS,
    CRX_NAME,
    XPI_NAME,
    CHROME_UPDATER_FILENAME,
    FIREFOX_UPDATER_FILENAME,
    MANIFEST_NAME,
    CHROME_UPDATE_URL,
    FIREFOX_UPDATE_URL,
    CHROME_UPDATE_CRX,
    FIREFOX_UPDATE_XPI,
    PROD_ENV,
    BROWSERS,
    PROD_ENVS,
};
