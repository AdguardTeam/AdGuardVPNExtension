const merge = require('webpack-merge');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ZipWebpackPlugin = require('zip-webpack-plugin');
const common = require('../webpack.common');
const { updateManifest } = require('../helpers');
const firefoxManifestDiff = require('./manifest.firefox');
const { PROD_API, IS_DEV } = require('../consts');

const FIREFOX_PATH = 'firefox';

let zipFilename = 'firefox.zip';

if (IS_DEV && PROD_API) {
    zipFilename = 'firefox-prod.zip';
}

const plugins = [
    new CopyWebpackPlugin([
        {
            from: path.resolve(__dirname, '../manifest.common.json'),
            to: 'manifest.json',
            // eslint-disable-next-line no-shadow, no-unused-vars
            transform: (content, path) => updateManifest(content, firefoxManifestDiff),
        },
    ]),
    new ZipWebpackPlugin({
        path: '../',
        filename: zipFilename,
    }),
];

const firefoxConfig = {
    output: {
        path: path.join(common.output.path, FIREFOX_PATH),
    },
    plugins,
};

module.exports = merge(common, firefoxConfig);
