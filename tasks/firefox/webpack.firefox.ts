import path from 'path';

import type webpack from 'webpack';
import { merge } from 'webpack-merge';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ZipWebpackPlugin from 'zip-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';

import { getCommonConfig } from '../webpack.common';
import { updateManifest } from '../helpers';
import {
    STAGE_ENV,
    IS_DEV,
    IS_BETA,
    StageEnv,
    Browser,
    SRC_PATH,
} from '../consts';

import { firefoxManifestDiff, firefoxManifestStandaloneDiff } from './manifest.firefox';

const FIREFOX_PATH = 'firefox';

let zipFilename = 'firefox.zip';

const BACKGROUND_PATH = path.resolve(__dirname, '..', SRC_PATH, 'background');

if (IS_DEV && STAGE_ENV === StageEnv.Prod) {
    zipFilename = 'firefox-prod.zip';
}

const commonConfig = getCommonConfig(Browser.Firefox);

const plugins: webpack.WebpackPluginInstance[] = [
    new CopyWebpackPlugin({
        patterns: [
            {
                from: path.resolve(__dirname, '../manifest.common.json'),
                to: 'manifest.json',
                transform: (content: Buffer) => {
                    let result = updateManifest(content, firefoxManifestDiff);

                    // Append beta standalone update URL
                    if (IS_BETA) {
                        result = updateManifest(result, firefoxManifestStandaloneDiff);
                    }

                    return result;
                },
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
    }) as unknown as webpack.WebpackPluginInstance,
];

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
