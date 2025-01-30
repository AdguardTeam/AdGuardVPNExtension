import { promises as fs } from 'fs';
import path from 'path';

// @ts-ignore
import Crx from 'crx';
import chalk from 'chalk';
import { program } from 'commander';

import packageJson from '../package.json';

import { updateManifest } from './helpers';
import {
    CHROME_UPDATE_URL,
    MANIFEST_NAME,
    Browser,
    BUILD_PATH,
    BUILD_ENV_MAP,
    CERTIFICATE_PATHS,
    CHROME_UPDATE_CRX,
    CHROME_UPDATER_FILENAME,
    CRX_NAME,
    CRX_PROD_NAME,
    IS_DEV,
    STAGE_ENV,
    StageEnv,
    type Env,
} from './consts';

const { log, error } = console;

const { BUILD_ENV } = process.env;
const { outputPath } = BUILD_ENV_MAP[BUILD_ENV as string];

const WRITE_PATH = path.resolve(__dirname, BUILD_PATH, outputPath);

/**
 * Retrieves certificate private key depending on the environment
 *
 * @param crxName Name of the crx file (used for logging)
 * @returns Buffer of the private key
 *
 * @throws Error if the certificate is not found
 */
const getPrivateKey = async (crxName: string) => {
    const certificatePath = CERTIFICATE_PATHS[BUILD_ENV as Env];
    try {
        const privateKey = await fs.readFile(certificatePath);
        log(chalk.greenBright(`\nThe certificate is read from ${certificatePath}\n`));
        return privateKey;
    } catch (e: any) {
        error(chalk.redBright(`Can not create ${crxName} - the valid certificate is not found in ${certificatePath} - ${e.message}\n`));
        throw e;
    }
};

/**
 * Creates crx file from the loaded file
 *
 * @param loadedFile Loaded crx file
 * @param crxName Name of the crx file
 *
 * @throws Error if the crx file can not be created
 */
// TODO: remove any when crx will support types
const createCrx = async (loadedFile: any, crxName: string) => {
    try {
        const crxBuffer = await loadedFile.pack();
        const resolverPath = path.resolve(WRITE_PATH, crxName);
        await fs.writeFile(resolverPath, crxBuffer);
        log(chalk.greenBright(`${crxName} saved to ${resolverPath}\n`));
    } catch (e: any) {
        error(chalk.redBright(`Error: Can not create ${crxName} - ${e.message}\n`));
        throw e;
    }
};

/**
 * Creates update XML file for the extension manifest
 *
 * @param crx Instance of the Crx package
 * @param updateName Name of the update file
 *
 * @throws Error if the update file can not be created
 */
// TODO: remove any when crx will support types
const createXml = async (crx: any, updateName: string) => {
    try {
        const xmlBuffer = await crx.generateUpdateXML();
        const writeXmlPath = path.resolve(WRITE_PATH, updateName);
        await fs.writeFile(writeXmlPath, xmlBuffer);
        log(chalk.greenBright(`${updateName} saved to ${WRITE_PATH}\n`));
    } catch (e: any) {
        error(chalk.redBright(`Error: Can not create ${updateName} - ${e.message}\n`));
        throw e;
    }
};

/**
 * Packs extension to crx file for chrome browser with manifest version 3.
 *
 * Output files:
 * - chrome.crx and updated.xml - beta and release environments
 * - chrome.crx - dev environment with test stage environment
 * - chrome-prod.crx - dev environment with prod stage environment
 */
const generateChromeFiles = async () => {
    const loadPath = path.resolve(WRITE_PATH, Browser.Chrome);
    const manifestPath = path.resolve(loadPath, MANIFEST_NAME);

    let crxFileName = CRX_NAME;
    if (IS_DEV && STAGE_ENV === StageEnv.Prod) {
        crxFileName = CRX_PROD_NAME;
    }

    try {
        const chromeManifest = await fs.readFile(manifestPath);
        const privateKey = await getPrivateKey(crxFileName);

        const crx = new Crx({
            codebase: CHROME_UPDATE_CRX,
            privateKey,
            publicKey: packageJson.name,
        });

        if (IS_DEV) {
            // for dev environment we just create crx file
            const loadedFile = await crx.load(loadPath);
            await createCrx(loadedFile, crxFileName);
        } else {
            // for beta and release environments we add the update_url property to the manifest
            // Add to the chrome manifest `update_url` property
            // which is to be present while creating the crx file
            const updatedManifest = updateManifest(chromeManifest, { update_url: CHROME_UPDATE_URL });
            await fs.writeFile(manifestPath, updatedManifest);

            const loadedFile = await crx.load(loadPath);
            await createCrx(loadedFile, crxFileName);
            await createXml(crx, CHROME_UPDATER_FILENAME);

            // Delete from the chrome manifest `update_url` property
            // after the crx file has been created - reset the manifest
            await fs.writeFile(manifestPath, chromeManifest);
        }
    } catch (e: any) {
        error(chalk.redBright(e.message));
        error(e);

        // Fail the task execution
        process.exit(1);
    }
};

program
    .description('Packs extension to crx file for chrome browser with manifest version 3')
    .action(generateChromeFiles);

program.parse(process.argv);
