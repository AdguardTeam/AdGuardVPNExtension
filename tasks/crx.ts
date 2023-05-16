import { promises as fs } from 'fs';
import path from 'path';
// @ts-ignore
import Crx from 'crx';
import chalk from 'chalk';
import { program } from 'commander';

const { log, error } = console;

const {
    CHROME_UPDATE_URL,
    MANIFEST_NAME,
    Browser,
    BUILD_PATH,
    ENV_MAP,
    CERTIFICATE_PATHS,
    CHROME_UPDATE_CRX,
    CHROME_UPDATER_FILENAME,
    CRX_NAME,
    CRX_MV3_NAME,
    MV3,
} = require('./consts');
const { updateManifest } = require('./helpers');
const packageJson = require('../package.json');

const { BUILD_ENV } = process.env;
const { outputPath } = ENV_MAP[BUILD_ENV as string];

const WRITE_PATH = path.resolve(__dirname, BUILD_PATH, outputPath);

const getPrivateKey = async () => {
    const certificatePath = CERTIFICATE_PATHS[BUILD_ENV as string];
    try {
        const privateKey = await fs.readFile(certificatePath);
        log(chalk.greenBright(`\nThe certificate is read from ${certificatePath}\n`));
        return privateKey;
    } catch (e: any) {
        error(chalk.redBright(`Can not create ${CRX_NAME} - the valid certificate is not found in ${certificatePath} - ${e.message}\n`));
        throw e;
    }
};

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

// TODO: remove any when crx will support types
const createXml = async (crx: any) => {
    const xmlBuffer = await crx.generateUpdateXML();
    const writeXmlPath = path.resolve(WRITE_PATH, CHROME_UPDATER_FILENAME);
    await fs.writeFile(writeXmlPath, xmlBuffer);
    log(chalk.greenBright(`${CHROME_UPDATER_FILENAME} saved to ${WRITE_PATH}\n`));
};

const generateChromeFiles = async (isMV3: boolean = false) => {
    const loadPath = path.resolve(WRITE_PATH, isMV3 ? Browser.ChromeMV3 : Browser.Chrome);
    const crxName = isMV3 ? CRX_MV3_NAME : CRX_NAME;
    const manifestPath = path.resolve(loadPath, MANIFEST_NAME);

    try {
        const chromeManifest = await fs.readFile(manifestPath);
        const PRIVATE_KEY = await getPrivateKey();

        const crx = new Crx({
            codebase: CHROME_UPDATE_CRX,
            privateKey: PRIVATE_KEY,
            publicKey: packageJson.name,
        });

        // Add to the chrome manifest `update_url` property
        // which is to be present while creating the crx file
        const updatedManifest = updateManifest(chromeManifest, { update_url: CHROME_UPDATE_URL });
        await fs.writeFile(manifestPath, updatedManifest);

        const loadedFile = await crx.load(loadPath);
        await createCrx(loadedFile, crxName);
        await createXml(crx);

        // Delete from the chrome manifest `update_url` property
        // after the crx file has been created - reset the manifest
        await fs.writeFile(manifestPath, chromeManifest);
    } catch (e: any) {
        error(chalk.redBright(e.message));
        error(e);

        // Fail the task execution
        process.exit(1);
    }
};

let isMV3 = true;

program
    .command(MV3)
    .action(() => {
        isMV3 = true;
    });

program
    .description('By default builds for manifest version 2')
    .action(() => {});

program.parse(process.argv);

// generate for mv2 by default
generateChromeFiles();

// generate for mv3
generateChromeFiles(isMV3);
