const { merge } = require('webpack-merge');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ZipWebpackPlugin = require('zip-webpack-plugin');
const common = require('../webpack.common');
const { updateManifest } = require('../helpers');
const operaManifestDiff = require('./manifest.opera');
const { STAGE_ENV, IS_DEV, STAGE_ENVS } = require('../consts');

const OPERA_PATH = 'opera';

let zipFilename = 'opera.zip';

if (IS_DEV && STAGE_ENV === STAGE_ENVS.PROD) {
    zipFilename = 'opera-prod.zip';
}

const plugins = [
    new CopyWebpackPlugin({
        patterns: [
            {
                from: path.resolve(__dirname, '../manifest.common.json'),
                to: 'manifest.json',
                transform: (content) => updateManifest(content, operaManifestDiff),
            },
        ],
    }),
    new ZipWebpackPlugin({
        path: '../',
        filename: zipFilename,
    }),
];

const operaConfig = {
    output: {
        path: path.join(common.output.path, OPERA_PATH),
    },
    plugins,
};

module.exports = merge(common, operaConfig);
