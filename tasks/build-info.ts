import path from 'path';
import { promises as fsp } from 'fs';

import { version } from '../package.json';

import {
    BUILD_ENV,
    BUILD_PATH,
    IS_BETA,
    isValidBuildEnv,
} from './consts';
import { getOutputPathByEnv } from './helpers';

if (!isValidBuildEnv(BUILD_ENV)) {
    throw new Error(`Invalid BUILD_ENV: ${BUILD_ENV}`);
}

const BUILD_TXT_FILENAME = 'build.txt';
const BUILD_TXT_CONTENT = IS_BETA
    // required for proper github tag preparing. AG-27644
    ? `version=${version}-beta`
    : `version=${version}`;

const outputPath = getOutputPathByEnv(BUILD_ENV);
const filePath = path.resolve(__dirname, BUILD_PATH, outputPath, BUILD_TXT_FILENAME);

/**
 * Writes build.txt file with current version.
 * Required for Bamboo CI to publish as artifact and for GitHub tag preparation.
 *
 * @returns Promise which resolves when the file is written.
 */
export const buildInfo = async (): Promise<void> => {
    await fsp.writeFile(filePath, BUILD_TXT_CONTENT, 'utf-8');
};
