/* eslint-disable no-console */
import { promises as fs } from 'fs';
import path from 'path';

import chalk from 'chalk';

import {
    BUILD_ENV_MAP,
    BUILD_PATH,
    FIREFOX_UPDATE_TEMPLATE_PATH,
    FIREFOX_UPDATER_FILENAME,
    FIREFOX_UPDATE_XPI,
} from '../consts';
import { version } from '../../package.json';

import { firefoxManifestDiff } from './manifest.firefox';

const { outputPath } = BUILD_ENV_MAP[process.env.BUILD_ENV as string];
const WRITE_PATH = path.resolve(__dirname, '..', BUILD_PATH, outputPath);

export const buildUpdateJson = async () => {
    try {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { id, strict_min_version } = firefoxManifestDiff.browser_specific_settings.gecko;

        // create update.json
        let updateJsonTemplate = (await fs.readFile(FIREFOX_UPDATE_TEMPLATE_PATH)).toString();
        updateJsonTemplate = updateJsonTemplate
            .replace(/%VERSION%/g, version)
            .replace(/%EXTENSION_ID%/g, id)
            .replace(/%UPDATE_LINK%/g, FIREFOX_UPDATE_XPI)
            .replace(/%STRICT_MIN_VERSION%/g, strict_min_version);

        // write update.json
        await fs.writeFile(path.join(WRITE_PATH, FIREFOX_UPDATER_FILENAME), Buffer.from(updateJsonTemplate));

        console.log(chalk.greenBright(`${FIREFOX_UPDATER_FILENAME} saved to ${WRITE_PATH}\n`));
    } catch (e: any) {
        console.error(chalk.redBright(`Error: Can not create ${FIREFOX_UPDATER_FILENAME} - ${e.message}\n`));
        throw e;
    }
};
