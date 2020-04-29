/* eslint-disable no-console */
const webExt = require('web-ext');
const path = require('path');
const { promises: fs } = require('fs');
const chalk = require('chalk');
const credentials = require('../private/AdguardVPN/mozilla_credentials.json');

const {
    BROWSER_TYPES,
    ENV_MAP,
    FIREFOX_UPDATE_XPI,
    BUILD_PATH,
    MANIFEST_NAME,
    FIREFOX_UPDATER_FILENAME,
    XPI_NAME,
} = require('./consts');
const config = require('../package');

const { apiKey, apiSecret } = credentials;

const { BUILD_ENV } = process.env;
const { outputPath } = ENV_MAP[BUILD_ENV];

const BUILD = 'build';

const buildDir = path.resolve(BUILD, ENV_MAP[BUILD_ENV].outputPath);
const fileDir = path.resolve(buildDir, FIREFOX_UPDATER_FILENAME);

const getFirefoxManifest = async () => {
    const MANIFEST_PATH = path.resolve(
        __dirname, BUILD_PATH, outputPath, BROWSER_TYPES.FIREFOX, MANIFEST_NAME
    );
    const manifestBuffer = await fs.readFile(MANIFEST_PATH);
    const manifest = JSON.parse(manifestBuffer.toString());
    return manifest;
};

async function generateXpi() {
    const sourceDir = path.resolve(BUILD, ENV_MAP[BUILD_ENV].outputPath, BROWSER_TYPES.FIREFOX);

    const { downloadedFiles } = await webExt.default.cmd.sign({
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

        console.log(chalk.greenBright(`File saved to ${xpiPath}\n`));
    }
}

const getFileContent = (
    {
        // eslint-disable-next-line camelcase
        id, version, update_link, strict_min_version,
    }
) => ({
    addons: {
        [id]: {
            updates: [
                {
                    version,
                    update_link,
                    applications: {
                        gecko: {
                            strict_min_version,
                        },
                    },
                },
            ],
        },
    },
});

const createUpdateJson = async (manifest) => {
    try {
        // eslint-disable-next-line camelcase
        const { id, strict_min_version } = manifest.applications.gecko;

        const fileContent = getFileContent(
            {
                id, version: config.version, update_link: FIREFOX_UPDATE_XPI, strict_min_version,
            }
        );

        const fileJson = JSON.stringify(fileContent, null, 4);

        await fs.writeFile(fileDir, fileJson);
        console.log(chalk.greenBright(`${FIREFOX_UPDATER_FILENAME} saved in ${buildDir}\n`));
    } catch (error) {
        console.error(chalk.redBright(`Error: cannot create ${FIREFOX_UPDATER_FILENAME} - ${error.message}\n`));
        throw error;
    }
};

const generateFirefoxArtifacts = async () => {
    try {
        await generateXpi();
        const manifest = await getFirefoxManifest();
        await createUpdateJson(manifest);
    } catch (error) {
        console.error(chalk.redBright(error.message));
        console.error(error);
        // Fail the task execution
        process.exit(1);
    }
};

generateFirefoxArtifacts();
