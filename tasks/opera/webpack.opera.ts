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
    StageEnv,
    Browser,
    SRC_PATH,
} from '../consts';

import { operaManifestDiff } from './manifest.opera';

const OPERA_PATH = 'opera';

let zipFilename = 'opera.zip';

if (IS_DEV && STAGE_ENV === StageEnv.Prod) {
    zipFilename = 'opera-prod.zip';
}

const commonConfig = getCommonConfig(Browser.Opera);

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
                transform: (content: Buffer) => updateManifest(content, operaManifestDiff),
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

const operaDiffConfig = {
    entry: {
        offscreen: OFFSCREEN_PATH,
        worker: WORKER_SCRIPT,
    },
    output: {
        path: path.join(outputPath, OPERA_PATH),
    },
    plugins,
};

export const operaConfig = merge(commonConfig, operaDiffConfig);
