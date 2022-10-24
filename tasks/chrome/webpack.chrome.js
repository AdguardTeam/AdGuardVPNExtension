const { merge } = require('webpack-merge');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ZipWebpackPlugin = require('zip-webpack-plugin');
const { getCommonConfig } = require('../webpack.common');
const { updateManifest } = require('../helpers');
const chromeManifestDiff = require('./manifest.chrome');
const {
    STAGE_ENV,
    IS_DEV,
    STAGE_ENVS,
    BROWSERS,
} = require('../consts');

const CHROME_PATH = 'chrome';

let zipFilename = 'chrome.zip';

if (IS_DEV && STAGE_ENV === STAGE_ENVS.PROD) {
    zipFilename = 'chrome-prod.zip';
}

const commonConfig = getCommonConfig(BROWSERS.CHROME);

const plugins = [
    new CopyWebpackPlugin({
        patterns: [
            {
                from: path.resolve(__dirname, '../manifest.common.json'),
                to: 'manifest.json',
                transform: (content) => updateManifest(content, chromeManifestDiff),
            },
        ],
    }),
    new ZipWebpackPlugin({
        path: '../',
        filename: zipFilename,
    }),
];

const chromeConfig = {
    output: {
        path: path.join(commonConfig.output.path, CHROME_PATH),
    },
    plugins,
};

module.exports = merge(commonConfig, chromeConfig);
