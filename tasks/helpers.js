const {
    LOCALES_PATH,
    ENV_MAP,
    IS_DEV,
    ENVS,
    BUILD_ENV,
} = require('./consts');
const pJson = require('../package');

const getNameByEnv = (env = ENVS.DEV) => {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const locales = require(LOCALES_PATH);
    if (!locales) {
        throw new Error(`Wrong path to locales ${LOCALES_PATH}`);
    }
    const { name } = locales;

    const envData = ENV_MAP[env];
    if (!envData) {
        throw new Error(`Wrong environment: ${env}`);
    }

    return envData.name ? `${name.message} ${envData.name}` : `${name.message}`;
};

const updateManifest = (manifestJson, browserManifestDiff) => {
    let manifest;
    try {
        manifest = JSON.parse(manifestJson.toString());
    } catch (e) {
        throw new Error('unable to parse json from manifest');
    }
    const devPolicy = IS_DEV ? { content_security_policy: "script-src 'self' 'unsafe-eval'; object-src 'self'" } : {};
    const name = getNameByEnv(BUILD_ENV);
    const updatedManifest = {
        ...manifest,
        ...browserManifestDiff,
        ...devPolicy,
        name,
        version: pJson.version,
    };
    return Buffer.from(JSON.stringify(updatedManifest, null, 4));
};

const getOutputPathByEnv = (env = ENVS.DEV) => {
    const envData = ENV_MAP[env];
    if (!envData) {
        throw new Error(`Wrong environment: ${env}`);
    }
    return envData.outputPath;
};

module.exports = { getNameByEnv, updateManifest, getOutputPathByEnv };
