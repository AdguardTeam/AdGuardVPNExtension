import webpack, { Plugin } from 'webpack';
import { merge } from 'webpack-merge';
import path from 'path';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ZipWebpackPlugin from 'zip-webpack-plugin';

import { getCommonConfig } from '../webpack.common';
import { updateManifest } from '../helpers';
import { edgeManifestDiff } from './manifest.edge';
import {
    STAGE_ENV,
    IS_DEV,
    StageEnvs,
    Browsers,
} from '../consts';

const EDGE_PATH = 'edge';

let zipFilename = 'edge.zip';

if (IS_DEV && STAGE_ENV === StageEnvs.Prod) {
    zipFilename = 'edge-prod.zip';
}

const commonConfig = getCommonConfig(Browsers.Edge);

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
                transform: (content: Buffer) => updateManifest(content, edgeManifestDiff),
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

const edgeDiffConfig = {
    output: {
        path: path.join(outputPath, EDGE_PATH),
    },
    plugins,
};

export const edgeConfig = merge(commonConfig, edgeDiffConfig);
