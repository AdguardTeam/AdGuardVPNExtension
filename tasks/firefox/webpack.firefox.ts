import { Plugin } from 'webpack';
import { merge } from 'webpack-merge';
import path from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ZipWebpackPlugin from 'zip-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';

import { getCommonConfig } from '../webpack.common';
import { updateManifest } from '../helpers';
import { firefoxManifestDiff } from './manifest.firefox';
import {
    STAGE_ENV,
    IS_DEV,
    STAGE_ENVS,
    BROWSERS, SRC_PATH,
} from '../consts';

const FIREFOX_PATH = 'firefox';

let zipFilename = 'firefox.zip';

const BACKGROUND_PATH = path.resolve(__dirname, '..', SRC_PATH, 'background');

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
                transform: (content: Buffer) => updateManifest(content, firefoxManifestDiff),
            },
        ],
    }),
    new HtmlWebpackPlugin({
        template: path.join(BACKGROUND_PATH, 'index.html'),
        filename: 'background.html',
        chunks: ['background'],
        cache: false,
    }),
    new ZipWebpackPlugin({
        path: '../',
        filename: zipFilename,
    }),
] as unknown as Plugin[];

const outputPath = commonConfig.output?.path;

if (!outputPath) {
    throw new Error('Cannot get output path');
}

const firefoxDiffConfig = {
    output: {
        path: path.join(outputPath, FIREFOX_PATH),
    },
    plugins,
};

export const firefoxConfig = merge(commonConfig, firefoxDiffConfig);
