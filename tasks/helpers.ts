// eslint-disable-next-line @typescript-eslint/naming-convention
import _ from 'lodash';
import { merge } from 'webpack-merge';

import { Browser, BUILD_ENV_MAP, Env } from './consts';
import { type BrowserConfig, BROWSERS_CONF } from './common-constants';

export const getBrowserConf = (browser: Browser): BrowserConfig => {
    const browserConf = BROWSERS_CONF[browser];
    if (!browserConf) {
        throw new Error(`No browser config for: "${browser}"`);
    }
    return browserConf;
};

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

    // Merge the parts
    const union = merge(manifest, browserManifestDiff);

    const updatedManifest = {
        ...union,
        permissions,
        version: pJson.version,
    };

    return Buffer.from(JSON.stringify(updatedManifest, null, 4));
};

export const getOutputPathByEnv = (env = Env.Dev): string => {
    const envData = BUILD_ENV_MAP[env];
    if (!envData) {
        throw new Error(`Wrong environment: ${env}`);
    }
    return envData.outputPath;
};

export const updateLocalesMSGName = (content: Buffer, env: string): string => {
    // Chrome Web Store allows only 45 symbol long names
    const NAME_MAX_LENGTH = 45;
    const envData = BUILD_ENV_MAP[env];

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

/**
 * Updates the "short_name" key to "sn" for Opera browser only.
 *
 * TODO: Remove after Opera Add-Ons store fixes the issue (AG-44559)
 *
 * @param locale Content of the locale file.
 * @param browser Browser target.
 *
 * @returns Updated content with "sn" key.
 */
export const updateOperaShortNameKey = (locale: Buffer, browser: Browser): Buffer => {
    if (browser !== Browser.Opera) {
        return locale;
    }

    try {
        const content = JSON.parse(locale.toString());
        content.sn = content.short_name;
        return Buffer.from(JSON.stringify(content, null, 4));
    } catch (e) {
        throw new Error('Unable to parse json from locale file');
    }
};
