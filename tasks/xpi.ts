// @ts-ignore there are no types for web-ext
import webExt from 'web-ext';
import path from 'path';
import { promises as fs } from 'fs';
import chalk from 'chalk';
import { Manifest } from 'webextension-polyfill';

import {
    Browser,
    ENV_MAP,
    FIREFOX_UPDATE_XPI,
    BUILD_PATH,
    MANIFEST_NAME,
    FIREFOX_UPDATER_FILENAME,
    XPI_NAME,
    FIREFOX_UPDATE_URL,
} from './consts';
import packageJson from '../package.json';

const { log, error } = console;

const { outputPath } = ENV_MAP[process.env.BUILD_ENV as string];

const buildDir = path.resolve(__dirname, BUILD_PATH, outputPath);
const fileDir = path.resolve(buildDir, FIREFOX_UPDATER_FILENAME);

const getFirefoxManifest = async (): Promise<Manifest.ManifestBase> => {
    const MANIFEST_PATH = path.resolve(
        __dirname,
        BUILD_PATH,
        outputPath,
        Browser.Firefox,
        MANIFEST_NAME,
    );
    const manifestBuffer = await fs.readFile(MANIFEST_PATH);
    const manifest = JSON.parse(manifestBuffer.toString());
    return manifest;
};

async function generateXpi(): Promise<void> {
    const sourceDir = path.resolve(__dirname, BUILD_PATH, outputPath, Browser.Firefox);
    const credentialsPath = path.resolve(__dirname, '../private/AdguardVPN/mozilla_credentials.json');

    // require called here in order to escape errors, until this module is really necessary
    // eslint-disable-next-line global-require, import/no-unresolved,import/extensions
    const cryptor = require('../private/cryptor/dist');
    const credentialsContent = await cryptor(process.env.CREDENTIALS_PASSWORD)
        .getDecryptedContent(credentialsPath);
    const { apiKey, apiSecret } = JSON.parse(credentialsContent);

    const { downloadedFiles } = await webExt.cmd.sign({
        apiKey,
        apiSecret,
        sourceDir,
        artifactsDir: buildDir,
    }, {
        shouldExitProgram: false,
    });

    if (downloadedFiles) {
        const [downloadedXpi] = downloadedFiles;

        // Rename
        const basePath = path.dirname(downloadedXpi);
        const xpiPath = path.join(basePath, XPI_NAME);
        await fs.rename(downloadedXpi, xpiPath);

        log(chalk.greenBright(`File saved to ${xpiPath}\n`));
    }
}

type CreateUpdateJsonContentProps = {
    id: string,
    version: string,
    updateLink: string,
    strictMinVersion?: string,
};

/**
 * Creates object for update.json
 */
const createUpdateJsonContent = (
    {
        id,
        version,
        updateLink,
        strictMinVersion,
    }: CreateUpdateJsonContentProps,
) => ({
    addons: {
        [id]: {
            updates: [
                {
                    version,
                    updateLink,
                    browser_specific_settings: {
                        gecko: {
                            strictMinVersion,
                        },
                    },
                },
            ],
        },
    },
});

const createUpdateJson = async (manifest: Manifest.ManifestBase): Promise<void> => {
    try {
        if (!manifest.browser_specific_settings?.gecko) {
            return;
        }

        const {
            id,
            strict_min_version: strictMinVersion,
        } = manifest.browser_specific_settings.gecko;

        if (!id || !strictMinVersion) {
            return;
        }

        const fileContent = createUpdateJsonContent(
            {
                id,
                version: packageJson.version,
                updateLink: FIREFOX_UPDATE_XPI,
                strictMinVersion,
            },
        );

        const fileJson = JSON.stringify(fileContent, null, 4);

        await fs.writeFile(fileDir, fileJson);
        log(chalk.greenBright(`${FIREFOX_UPDATER_FILENAME} saved in ${buildDir}\n`));
    } catch (e) {
        error(chalk.redBright(`Error: cannot create ${FIREFOX_UPDATER_FILENAME} - ${e.message}\n`));
        throw e;
    }
};

const updateFirefoxManifest = async (): Promise<void> => {
    const MANIFEST_PATH = path.resolve(
        __dirname,
        BUILD_PATH,
        outputPath,
        Browser.Firefox,
        MANIFEST_NAME,
    );
    const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, 'utf-8'));
    manifest.browser_specific_settings.gecko.update_url = FIREFOX_UPDATE_URL;
    await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 4));
};

const generateFirefoxArtifacts = async (): Promise<void> => {
    try {
        await updateFirefoxManifest();
        await generateXpi();
        const manifest = await getFirefoxManifest();
        await createUpdateJson(manifest);
    } catch (e) {
        error(chalk.redBright(e.message));
        error(e);
        // Fail the task execution
        process.exit(1);
    }
};

generateFirefoxArtifacts();
