const { merge } = require('webpack-merge');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ZipWebpackPlugin = require('zip-webpack-plugin');
const { getCommonConfig } = require('../webpack.common');
const { updateManifest } = require('../helpers');
const edgeManifestDiff = require('./manifest.edge');
const {
    STAGE_ENV,
    IS_DEV,
    STAGE_ENVS,
    BROWSERS,
} = require('../consts');

const EDGE_PATH = 'edge';

let zipFilename = 'edge.zip';

if (IS_DEV && STAGE_ENV === STAGE_ENVS.PROD) {
    zipFilename = 'edge-prod.zip';
}

const commonConfig = getCommonConfig(BROWSERS.EDGE);

const plugins = [
    new CopyWebpackPlugin({
        patterns: [
            {
                from: path.resolve(__dirname, '../manifest.common.json'),
                to: 'manifest.json',
                transform: (content) => updateManifest(content, edgeManifestDiff),
            },
        ],
    }),
    new ZipWebpackPlugin({
        path: '../',
        filename: zipFilename,
    }),
];

const edgeConfig = {
    output: {
        path: path.join(commonConfig.output.path, EDGE_PATH),
    },
    plugins,
};

module.exports = merge(commonConfig, edgeConfig);
