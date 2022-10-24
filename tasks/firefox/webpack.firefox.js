const { merge } = require('webpack-merge');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ZipWebpackPlugin = require('zip-webpack-plugin');
const { getCommonConfig } = require('../webpack.common');
const { updateManifest } = require('../helpers');
const firefoxManifestDiff = require('./manifest.firefox');
const {
    STAGE_ENV,
    IS_DEV,
    STAGE_ENVS,
    BROWSERS,
} = require('../consts');

const FIREFOX_PATH = 'firefox';

let zipFilename = 'firefox.zip';

if (IS_DEV && STAGE_ENV === STAGE_ENVS.PROD) {
    zipFilename = 'firefox-prod.zip';
}

const commonConfig = getCommonConfig(BROWSERS.FIREFOX);

const plugins = [
    new CopyWebpackPlugin({
        patterns: [
            {
                from: path.resolve(__dirname, '../manifest.common.json'),
                to: 'manifest.json',
                transform: (content) => updateManifest(content, firefoxManifestDiff),
            },
        ],
    }),
    new ZipWebpackPlugin({
        path: '../',
        filename: zipFilename,
    }),
];

const firefoxConfig = {
    output: {
        path: path.join(commonConfig.output.path, FIREFOX_PATH),
    },
    plugins,
};

module.exports = merge(commonConfig, firefoxConfig);
