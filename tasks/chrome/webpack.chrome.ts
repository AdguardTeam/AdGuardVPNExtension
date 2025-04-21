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
    SRC_PATH,
    IS_DEV,
    StageEnv,
    Browser,
} from '../consts';

import { chromeManifestDiff } from './manifest.chrome';

const CHROME_PATH = 'chrome';

let zipFilename = 'chrome.zip';

if (IS_DEV && STAGE_ENV === StageEnv.Prod) {
    zipFilename = 'chrome-prod.zip';
}

const commonConfig = getCommonConfig(Browser.Chrome);

const OFFSCREEN_PATH = path.resolve(__dirname, '..', SRC_PATH, 'offscreen');
const WORKER_SCRIPT = path.resolve(__dirname, '..', SRC_PATH, 'worker/worker.ts');

const plugins: webpack.WebpackPluginInstance[] = [
    new HtmlWebpackPlugin({
        template: path.join(OFFSCREEN_PATH, 'index.html'),
        filename: 'offscreen.html',
        chunks: ['offscreen'],
        cache: false,
    }),
    new CopyWebpackPlugin({
        patterns: [
            {
                from: path.resolve(__dirname, '../manifest.common.json'),
                to: 'manifest.json',
                transform: (content: Buffer) => updateManifest(content, chromeManifestDiff),
            },
        ],
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

const chromeDiffConfig = {
    entry: {
        offscreen: OFFSCREEN_PATH,
        worker: WORKER_SCRIPT,
    },
    output: {
        path: path.join(outputPath, CHROME_PATH),
    },
    plugins,
};

export const chromeConfig = merge(commonConfig, chromeDiffConfig);
