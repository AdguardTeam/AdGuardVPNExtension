import webpack, { Plugin } from 'webpack';
import { merge } from 'webpack-merge';
import path from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ZipWebpackPlugin from 'zip-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';

import { getCommonConfig } from '../webpack.common';
import { updateManifest } from '../helpers';
import { operaManifestDiff } from './manifest.opera';
import {
    STAGE_ENV,
    IS_DEV,
    StageEnvs,
    Browser,
    SRC_PATH,
} from '../consts';

const BACKGROUND_PATH = path.resolve(__dirname, '..', SRC_PATH, 'background');

const OPERA_PATH = 'opera';

let zipFilename = 'opera.zip';

if (IS_DEV && STAGE_ENV === StageEnvs.Prod) {
    zipFilename = 'opera-prod.zip';
}

const commonConfig = getCommonConfig(Browser.Opera);

const plugins = [
    // TODO: on move to MV3 inject Mv3Timers
    new webpack.NormalModuleReplacementPlugin(/\.\/AbstractTimers/, ((resource: any) => {
        // eslint-disable-next-line no-param-reassign
        resource.request = resource.request.replace(/\.\/AbstractTimers/, './Mv2Timers');
    })),
    new CopyWebpackPlugin({
        patterns: [
            {
                from: path.resolve(__dirname, '../manifest.common.json'),
                to: 'manifest.json',
                transform: (content: Buffer) => updateManifest(content, operaManifestDiff),
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

const operaDiffConfig = {
    output: {
        path: path.join(outputPath, OPERA_PATH),
    },
    plugins,
};

export const operaConfig = merge(commonConfig, operaDiffConfig);
