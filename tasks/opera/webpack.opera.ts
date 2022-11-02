import { Plugin } from 'webpack';
import { merge } from 'webpack-merge';
import path from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ZipWebpackPlugin from 'zip-webpack-plugin';

import { getCommonConfig } from '../webpack.common';
import { updateManifest } from '../helpers';
import { operaManifestDiff } from './manifest.opera';
import {
    STAGE_ENV,
    IS_DEV,
    STAGE_ENVS,
    BROWSERS,
} from '../consts';

const OPERA_PATH = 'opera';

let zipFilename = 'opera.zip';

if (IS_DEV && STAGE_ENV === STAGE_ENVS.PROD) {
    zipFilename = 'opera-prod.zip';
}

const commonConfig = getCommonConfig(BROWSERS.OPERA);

const plugins = [
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
    }),
] as unknown as Plugin[];

const outputPath = commonConfig.output?.path;

if (!outputPath) {
    throw new Error('Cannot get output path');
}

const operaDiffConfig = {
    output: {
        path: path.join(outputPath, OPERA_PATH),
    },
    plugins,
};

export const operaConfig = merge(commonConfig, operaDiffConfig);
