// eslint-disable-next-line @typescript-eslint/naming-convention
import _ from 'lodash';

import {
    ENV_MAP,
    Env,
} from './consts';

const pJson = require('../package.json');

export const updateManifest = (manifestJson: Buffer, browserManifestDiff: { [key: string]: unknown }): Buffer => {
    let manifest;
    try {
        manifest = JSON.parse(manifestJson.toString());
    } catch (e) {
        throw new Error('unable to parse json from manifest');
    }
    const permissions = _.uniq([
        ...(manifest.permissions || []),
        // @ts-ignore
        ...(browserManifestDiff.permissions || []),
    ]).sort();
    const updatedManifest = {
        ...manifest,
        ...browserManifestDiff,
        permissions,
        version: pJson.version,
    };
    return Buffer.from(JSON.stringify(updatedManifest, null, 4));
};

/**
 * Adds provided suffix for release build
 * @param locales
 * @param env
 * @param suffix
 * @param isTarget
 */
export const modifyExtensionName = (
    locales: Buffer,
    env: string,
    suffix: string,
    isTarget: boolean = true,
): Buffer => {
    if (env !== Env.Release || !isTarget) {
        return locales;
    }

    try {
        const manifest = JSON.parse(locales.toString());
        manifest.name.message += suffix;
        return Buffer.from(JSON.stringify(manifest, null, 4));
    } catch (e) {
        throw new Error('Unable to parse json from manifest');
    }
};

export const getOutputPathByEnv = (env = Env.Dev): string => {
    const envData = ENV_MAP[env];
    if (!envData) {
        throw new Error(`Wrong environment: ${env}`);
    }
    return envData.outputPath;
};

export const updateLocalesMSGName = (content: Buffer, env: string): string => {
    // Chrome Web Store allows only 45 symbol long names
    const NAME_MAX_LENGTH = 45;
    const envData = ENV_MAP[env];

    if (!envData) {
        throw new Error(`Wrong environment: ${env}`);
    }

    const { name } = envData;
    const envName = ` ${name}`;

    const messages = JSON.parse(content.toString());

    // for dev and beta builds use short name + environment
    if (env !== Env.Release) {
        messages.name.message = messages.short_name.message + envName;
        return JSON.stringify(messages, null, 4);
    }

    if (messages.name && name.length > 0) {
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
