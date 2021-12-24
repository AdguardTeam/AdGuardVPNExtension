// eslint-disable-next-line @typescript-eslint/naming-convention
const _ = require('lodash');
const {
    ENV_MAP,
    IS_DEV,
    ENVS,
    BUILD_ENV,
} = require('./consts');
const pJson = require('../package.json');

const getNameByEnv = (env = ENVS.DEV, name) => {
    const envData = ENV_MAP[env];
    if (!envData) {
        throw new Error(`Wrong environment: ${env}`);
    }

    return envData.name ? `${name} ${envData.name}` : `${name}`;
};

const updateManifest = (manifestJson, browserManifestDiff) => {
    let manifest;
    try {
        manifest = JSON.parse(manifestJson.toString());
    } catch (e) {
        throw new Error('unable to parse json from manifest');
    }
    const devPolicy = IS_DEV ? { content_security_policy: "script-src 'self' 'unsafe-eval'; object-src 'self'" } : {};
    const name = getNameByEnv(BUILD_ENV, manifest.name);
    const permissions = _.uniq([
        ...(manifest.permissions || []),
        ...(browserManifestDiff.permissions || []),
    ]).sort();
    const updatedManifest = {
        ...manifest,
        ...browserManifestDiff,
        ...devPolicy,
        name,
        permissions,
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
