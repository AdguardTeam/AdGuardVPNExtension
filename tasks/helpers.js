// eslint-disable-next-line @typescript-eslint/naming-convention
const _ = require('lodash');
const {
    ENV_MAP,
    IS_DEV,
    ENVS,
} = require('./consts');
const pJson = require('../package.json');

const updateManifest = (manifestJson, browserManifestDiff) => {
    let manifest;
    try {
        manifest = JSON.parse(manifestJson.toString());
    } catch (e) {
        throw new Error('unable to parse json from manifest');
    }
    const devPolicy = IS_DEV ? { content_security_policy: "script-src 'self' 'unsafe-eval'; object-src 'self'" } : {};
    const permissions = _.uniq([
        ...(manifest.permissions || []),
        ...(browserManifestDiff.permissions || []),
    ]).sort();
    const updatedManifest = {
        ...manifest,
        ...browserManifestDiff,
        ...devPolicy,
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

const updateLocalesMSGName = (content, env) => {
    // Chrome Web Store allows only 45 symbol long names
    const NAME_MAX_LENGTH = 45;
    const envData = ENV_MAP[env];

    if (!envData) {
        throw new Error(`Wrong environment: ${env}`);
    }

    const { name } = envData;

    const messages = JSON.parse(content.toString());

    if (messages.name && name.length > 0) {
        const envName = ` ${name}`;
        messages.name.message += envName;
        // if name with suffix is too long, use short name + plus suffix
        if (messages.name.message.length > NAME_MAX_LENGTH) {
            messages.name.message = messages.short_name.message + envName;
        }

        if (messages.name.message.length > NAME_MAX_LENGTH) {
            throw new Error('Chrome Web Store allows only 45 symbol long names');
        }
    }

    return JSON.stringify(messages, null, 4);
};

module.exports = {
    updateManifest,
    getOutputPathByEnv,
    updateLocalesMSGName,
};
