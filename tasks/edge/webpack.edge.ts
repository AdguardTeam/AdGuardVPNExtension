import path from 'path';

import webpack from 'webpack';
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

import { edgeManifestDiff } from './manifest.edge';

const EDGE_PATH = 'edge';

let zipFilename = 'edge.zip';

if (IS_DEV && STAGE_ENV === StageEnv.Prod) {
    zipFilename = 'edge-prod.zip';
}

const commonConfig = getCommonConfig(Browser.Edge);

const OFFSCREEN_PATH = path.resolve(__dirname, '..', SRC_PATH, 'offscreen');
const WORKER_SCRIPT = path.resolve(__dirname, '..', SRC_PATH, 'worker/worker.ts');

const plugins: webpack.WebpackPluginInstance[] = [
    new HtmlWebpackPlugin({
        template: path.join(OFFSCREEN_PATH, 'index.html'),
        filename: 'offscreen.html',
        chunks: ['offscreen'],
        cache: false,
    }),
    new webpack.NormalModuleReplacementPlugin(/\.\/AbstractTimers/, ((resource: any) => {
        // TODO remove this replacement when MV3 will fix alarms bug,
        //  https://github.com/AdguardTeam/AdGuardVPNExtension/issues/116
        //  https://bugs.chromium.org/p/chromium/issues/detail?id=1472759
        // eslint-disable-next-line no-param-reassign
        resource.request = resource.request.replace(/\.\/AbstractTimers/, './Mv2Timers');
    })),
    new webpack.NormalModuleReplacementPlugin(/\.\/networkConnectionObserverAbstract/, ((resource: any) => {
        // eslint-disable-next-line no-param-reassign
        resource.request = resource.request.replace(/\.\/networkConnectionObserverAbstract/, './networkConnectionObserverMv3');
    })),
    new webpack.NormalModuleReplacementPlugin(/\.\/abstractProxyAuthTrigger/, ((resource: any) => {
        // eslint-disable-next-line no-param-reassign
        resource.request = resource.request.replace(/\.\/abstractProxyAuthTrigger/, './mv3');
    })),
    new CopyWebpackPlugin({
        patterns: [
            {
                from: path.resolve(__dirname, '../manifest.common.json'),
                to: 'manifest.json',
                transform: (content: Buffer) => updateManifest(content, edgeManifestDiff),
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

const edgeDiffConfig = {
    entry: {
        offscreen: OFFSCREEN_PATH,
        worker: WORKER_SCRIPT,
    },
    output: {
        path: path.join(outputPath, EDGE_PATH),
    },
    plugins,
};

export const edgeConfig = merge(commonConfig, edgeDiffConfig);
