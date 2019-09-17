const path = require('path');

const SRC_PATH = '../src';
const LOCALES_PATH = path.join(__dirname, SRC_PATH, '_locales/en/messages');
const ENV_MAP = {
    development: { outputPath: 'dev', name: 'Dev' },
    beta: { outputPath: 'beta', name: 'Beta' },
    release: { outputPath: 'release', name: '' },
};

const IS_DEV = process.env.NODE_ENV === 'development';

module.exports = {
    LOCALES_PATH, ENV_MAP, SRC_PATH, IS_DEV,
};
