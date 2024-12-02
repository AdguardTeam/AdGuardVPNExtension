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
    ChromeMV2 = 'chrome-mv2',
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

export const { BUILD_ENV, STAGE_ENV } = process.env;

export const IS_DEV = BUILD_ENV ? BUILD_ENV === Env.Dev : true;

export const IS_BETA = BUILD_ENV ? BUILD_ENV === Env.Beta : false;

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

export const deployPath = process.env.BUILD_ENV || Env.Dev;

// Update manifest URL for the Chrome extension
export const CHROME_UPDATE_URL = `https://static.adtidy.net/extensions/adguardvpn/${deployPath}/${CHROME_UPDATER_FILENAME}`;

// Update manifest URL for the Firefox add-on
export const FIREFOX_UPDATE_URL = `https://static.adtidy.net/extensions/adguardvpn/${deployPath}/${FIREFOX_UPDATER_FILENAME}`;

// Path to the Chrome CRX (that we'll add to the update manifest)
export const CHROME_UPDATE_CRX = `https://static.adtidy.net/extensions/adguardvpn/${deployPath}/${CRX_NAME}`;

// Path to the Firefox XPI (that we'll add to the update manifest)
export const FIREFOX_UPDATE_XPI = `https://static.adtidy.net/extensions/adguardvpn/${deployPath}/${XPI_NAME}`;
