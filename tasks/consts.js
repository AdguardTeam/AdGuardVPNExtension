const path = require('path');

// Set staging value
const { STAGING } = process.env;

const SRC_PATH = '../src';
const LOCALES_PATH = path.join(__dirname, SRC_PATH, '_locales/en/messages');

const ENVS = {
    DEV: 'dev',
    BETA: 'beta',
    RELEASE: 'release',
};

const ENV_MAP = {
    [ENVS.DEV]: { outputPath: 'dev', name: 'Dev' },
    [ENVS.BETA]: { outputPath: 'beta', name: 'Beta' },
    [ENVS.RELEASE]: { outputPath: 'release', name: '' },
};

const IS_DEV = STAGING ? STAGING === ENVS.DEV : ENVS.DEV;

module.exports = {
    LOCALES_PATH,
    ENV_MAP,
    SRC_PATH,
    IS_DEV,
    ENVS,
    STAGING,
};
