const { merge } = require('webpack-merge');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ZipWebpackPlugin = require('zip-webpack-plugin');
const common = require('../webpack.common');
const { updateManifest, modifyExtensionName } = require('../helpers');
const chromeManifestDiff = require('./manifest.chrome');
const { STAGE_ENV, IS_DEV, STAGE_ENVS } = require('../consts');

const CHROME_PATH = 'chrome';

let zipFilename = 'chrome.zip';

if (IS_DEV && STAGE_ENV === STAGE_ENVS.PROD) {
    zipFilename = 'chrome-prod.zip';
}

const plugins = [
    new CopyWebpackPlugin({
        patterns: [
            {
                from: path.resolve(__dirname, '../manifest.common.json'),
                to: 'manifest.json',
                transform: (content) => {
                    const updatedManifest = updateManifest(content, chromeManifestDiff);
                    return modifyExtensionName(
                        updatedManifest,
                        process.env.BUILD_ENV,
                        ' for Chrome',
                    );
                },
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
        path: path.join(common.output.path, CHROME_PATH),
    },
    plugins,
};

module.exports = merge(common, chromeConfig);
