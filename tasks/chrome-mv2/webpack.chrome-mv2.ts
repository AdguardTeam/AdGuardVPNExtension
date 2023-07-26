import webpack from 'webpack';
import { merge } from 'webpack-merge';
import path from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ZipWebpackPlugin from 'zip-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';

import { getCommonConfig } from '../webpack.common';
import { updateManifest } from '../helpers';
import { chromeManifestDiff } from './manifest.chrome-mv2';
import {
    STAGE_ENV,
    IS_DEV,
    StageEnv,
    Browser,
    SRC_PATH,
} from '../consts';

const BACKGROUND_PATH = path.resolve(__dirname, '..', SRC_PATH, 'background');

const CHROME_PATH = 'chrome-mv2';

let zipFilename = 'chrome-mv2.zip';

if (IS_DEV && STAGE_ENV === StageEnv.Prod) {
    zipFilename = 'chrome-mv2-prod.zip';
}

const commonConfig = getCommonConfig(Browser.ChromeMV2);

const plugins: webpack.WebpackPluginInstance[] = [
    new webpack.NormalModuleReplacementPlugin(/\.\/AbstractTimers/, ((resource: any) => {
        // eslint-disable-next-line no-param-reassign
        resource.request = resource.request.replace(/\.\/AbstractTimers/, './Mv2Timers');
    })),
    new webpack.NormalModuleReplacementPlugin(/\.\/networkConnectionObserverAbstract/, ((resource: any) => {
        // eslint-disable-next-line no-param-reassign
        resource.request = resource.request.replace(/\.\/networkConnectionObserverAbstract/, './networkConnectionObserverMv2');
    })),
    new webpack.NormalModuleReplacementPlugin(/\.\/abstractProxyAuthTrigger/, ((resource: any) => {
        // eslint-disable-next-line no-param-reassign
        resource.request = resource.request.replace(/\.\/abstractProxyAuthTrigger/, './mv2');
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

const chromeDiffConfig = {
    output: {
        path: path.join(outputPath, CHROME_PATH),
    },
    plugins,
};

export const chromeConfigMV2 = merge(commonConfig, chromeDiffConfig);
