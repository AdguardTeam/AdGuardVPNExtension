/* eslint-disable no-console */
const { promises: fs } = require('fs');
const path = require('path');
const Crx = require('crx');
const chalk = require('chalk');
const {
    CHROME_UPDATE_URL,
    MANIFEST_NAME,
    BROWSERS,
    BUILD_PATH,
    ENV_MAP,
    CERTIFICATE_PATHS,
    CHROME_UPDATE_CRX,
    CHROME_UPDATER_FILENAME,
    CRX_NAME,
} = require('./consts');
const { updateManifest } = require('./helpers');
const packageJson = require('../package.json');

const { BUILD_ENV } = process.env;
const { outputPath } = ENV_MAP[BUILD_ENV];

const WRITE_PATH = path.resolve(__dirname, BUILD_PATH, outputPath);
const LOAD_PATH = path
    .resolve(__dirname, BUILD_PATH, outputPath, BROWSERS.CHROME);
const MANIFEST_PATH = path.resolve(
    __dirname,
    BUILD_PATH,
    outputPath,
    BROWSERS.CHROME,
    MANIFEST_NAME,
);

const getPrivateKey = async () => {
    const certificatePath = CERTIFICATE_PATHS[BUILD_ENV];
    try {
        const privateKey = await fs.readFile(certificatePath);
        console.log(chalk.greenBright(`\nThe certificate is read from ${certificatePath}\n`));
        return privateKey;
    } catch (error) {
        console.error(chalk.redBright(`Can not create ${CRX_NAME} - the valid certificate is not found in ${certificatePath} - ${error.message}\n`));
        throw error;
    }
};

const createCrx = async (loadedFile) => {
    try {
        const crxBuffer = await loadedFile.pack();
        const writePath = path.resolve(WRITE_PATH, CRX_NAME);
        await fs.writeFile(writePath, crxBuffer);
        console.log(chalk.greenBright(`${CRX_NAME} saved to ${WRITE_PATH}\n`));
    } catch (error) {
        console.error(chalk.redBright(`Error: Can not create ${CRX_NAME} - ${error.message}\n`));
        throw error;
    }
};

const createXml = async (crx) => {
    const xmlBuffer = await crx.generateUpdateXML();
    const writeXmlPath = path.resolve(WRITE_PATH, CHROME_UPDATER_FILENAME);
    await fs.writeFile(writeXmlPath, xmlBuffer);
    console.log(chalk.greenBright(`${CHROME_UPDATER_FILENAME} saved to ${WRITE_PATH}\n`));
};

const generateChromeFiles = async () => {
    try {
        const chromeManifest = await fs.readFile(MANIFEST_PATH);
        const PRIVATE_KEY = await getPrivateKey();

        const crx = new Crx({
            codebase: CHROME_UPDATE_CRX,
            privateKey: PRIVATE_KEY,
            publicKey: packageJson.name,
        });

        // Add to the chrome manifest `update_url` property
        // which is to be present while creating the crx file
        const updatedManifest = updateManifest(chromeManifest, { update_url: CHROME_UPDATE_URL });
        await fs.writeFile(MANIFEST_PATH, updatedManifest);

        const loadedFile = await crx.load(LOAD_PATH);
        await createCrx(loadedFile);
        await createXml(crx);

        // Delete from the chrome manifest `update_url` property
        // after the crx file has been created - reset the manifest
        await fs.writeFile(MANIFEST_PATH, chromeManifest);
    } catch (error) {
        console.error(chalk.redBright(error.message));
        console.error(error);

        // Fail the task execution
        process.exit(1);
    }
};

generateChromeFiles();
