const merge = require('webpack-merge');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ZipWebpackPlugin = require('zip-webpack-plugin');
const common = require('../webpack.common');
const { updateManifest } = require('../helpers');
const chromeManifestDiff = require('./manifest.chrome');
const { PROD_API } = require('../consts');

const CHROME_PATH = 'chrome';

const zipFilename = PROD_API ? 'chrome-prod.zip' : 'chrome.zip';

const plugins = [
    new CopyWebpackPlugin([
        {
            from: path.resolve(__dirname, '../manifest.common.json'),
            to: 'manifest.json',
            // eslint-disable-next-line no-shadow, no-unused-vars
            transform: (content, path) => updateManifest(content, chromeManifestDiff),
        },
    ]),
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
