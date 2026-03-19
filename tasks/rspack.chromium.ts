import path from 'path';

import { rspack, type Configuration, type RspackPluginInstance } from '@rspack/core';
import { merge } from 'webpack-merge';
import ZipWebpackPlugin from 'zip-webpack-plugin';

import { getCommonConfig } from './rspack.common';
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
 * Get the rspack config for the Chromium browser.
 *
 * @param browser Browser name.
 * @param manifestDiff Manifest diff object.
 *
 * @returns Rspack configuration object.
 */
export const getChromiumRspackConfig = (
    browser: Browser,
    manifestDiff: Record<string, unknown>,
): Configuration => {
    if (!CHROMIUM_BROWSERS.includes(browser)) {
        throw new Error(`${browser} is not a valid Chromium browser`);
    }

    const outputFolder = browser;

    let zipFilename = `${outputFolder}.zip`;
    if (IS_DEV && STAGE_ENV === StageEnv.Prod) {
        zipFilename = `${outputFolder}-prod.zip`;
    }

    const commonConfig = getCommonConfig(browser);

    const plugins = [
        new rspack.HtmlRspackPlugin({
            template: path.join(OFFSCREEN_PATH, 'index.html'),
            filename: 'offscreen.html',
            chunks: ['offscreen'],
            cache: false,
        }),
        new rspack.CopyRspackPlugin({
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
        }) as unknown as RspackPluginInstance,
    ];

    const outputPath = commonConfig.output?.path;
    if (!outputPath) {
        throw new Error('Cannot get output path');
    }

    const diffConfig: Configuration = {
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
