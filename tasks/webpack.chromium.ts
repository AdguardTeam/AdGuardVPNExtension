import path from 'path';

import type webpack from 'webpack';
import { merge } from 'webpack-merge';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ZipWebpackPlugin from 'zip-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';

import { getCommonConfig } from './webpack.common';
import { updateManifest } from './helpers';
import {
    STAGE_ENV,
    SRC_PATH,
    IS_DEV,
    StageEnv,
    Browser,
} from './consts';

const OFFSCREEN_PATH = path.resolve(__dirname, SRC_PATH, 'offscreen');
const WORKER_SCRIPT = path.resolve(__dirname, SRC_PATH, 'worker/worker.ts');

const CHROMIUM_BROWSERS = [
    Browser.Chrome,
    Browser.Edge,
    Browser.Opera,
];

/**
 * Get the webpack config for the Chromium browser.
 *
 * @param browser Browser name.
 * @param manifestDiff Manifest diff object.
 *
 * @returns Webpack configuration object.
 */
export const getChromiumWebpackConfig = (
    browser: Browser,
    manifestDiff: Record<string, unknown>,
) => {
    if (!CHROMIUM_BROWSERS.includes(browser)) {
        throw new Error(`${browser} is not a valid Chromium browser`);
    }

    const outputFolder = browser;

    let zipFilename = `${outputFolder}.zip`;
    if (IS_DEV && STAGE_ENV === StageEnv.Prod) {
        zipFilename = `${outputFolder}-prod.zip`;
    }

    const commonConfig = getCommonConfig(browser);

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
                    from: path.resolve(__dirname, 'manifest.common.json'),
                    to: 'manifest.json',
                    transform: (content: Buffer) => updateManifest(content, manifestDiff),
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

    const diffConfig = {
        entry: {
            offscreen: OFFSCREEN_PATH,
            worker: WORKER_SCRIPT,
        },
        output: {
            path: path.join(outputPath, outputFolder),
        },
        plugins,
    };

    const finalConfig = merge(commonConfig, diffConfig);
    return finalConfig;
};
