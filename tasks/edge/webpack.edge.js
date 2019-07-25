const merge = require('webpack-merge');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const common = require('../webpack.common');
const { updateManifest } = require('../helpers');
const edgeManifestDiff = require('./manifest.edge');

const EDGE_PATH = 'edge';

const edgeConfig = {
    output: {
        path: path.join(common.output.path, EDGE_PATH),
    },
    plugins: [
        new CopyWebpackPlugin([
            {
                from: path.resolve(__dirname, '../manifest.common.json'),
                to: 'manifest.json',
                // eslint-disable-next-line no-shadow, no-unused-vars
                transform: (content, path) => updateManifest(content, edgeManifestDiff),
            },
        ]),
    ],
};

module.exports = merge(common, edgeConfig);
