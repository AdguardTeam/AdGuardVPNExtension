import webpack, { Plugin } from 'webpack';
import { merge } from 'webpack-merge';
import path from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ZipWebpackPlugin from 'zip-webpack-plugin';

import { getCommonConfig } from '../webpack.common';
import { updateManifest } from '../helpers';
import { chromeManifestDiff } from './manifest.chrome';
import {
    STAGE_ENV,
    IS_DEV,
    SRC_PATH,
    StageEnv,
    Browser,
} from '../consts';

const CHROME_PATH = 'chrome-mv3';

let zipFilename = 'chrome-mv3.zip';

const SERVICE_WORKER_WAKEUP_SCRIPT = path.resolve(__dirname, '..', SRC_PATH, 'content-scripts/serviceWorkerWakeUp.js');

if (IS_DEV && STAGE_ENV === StageEnv.Prod) {
    zipFilename = 'chrome-mv3-prod.zip';
}

const commonConfig = getCommonConfig(Browser.ChromeMV3);

// @ts-ignore
commonConfig.entry.serviceWorkerWakeUp = SERVICE_WORKER_WAKEUP_SCRIPT;

const plugins = [
    new webpack.NormalModuleReplacementPlugin(/\.\/AbstractTimers/, ((resource: any) => {
        // eslint-disable-next-line no-param-reassign
        resource.request = resource.request.replace(/\.\/AbstractTimers/, './Mv3Timers');
    })),
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
    }),
] as unknown as Plugin[];

const outputPath = commonConfig.output?.path;

if (!outputPath) {
    throw new Error('Cannot get output path');
}

const chromeDiffConfig = {
    output: {
        path: path.join(outputPath, CHROME_PATH),
    },
    plugins,
};

export const chromeConfigMV3 = merge(commonConfig, chromeDiffConfig);
