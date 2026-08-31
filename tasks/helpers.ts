// eslint-disable-next-line @typescript-eslint/naming-convention
import _ from 'lodash';
import { merge } from 'webpack-merge';

import {
    Browser,
    BUILD_ENV_MAP,
    Env,
    IS_BETA,
} from './consts';
import { type BrowserConfig, BROWSERS_CONF } from './common-constants';

export const getBrowserConf = (browser: Browser): BrowserConfig => {
    const browserConf = BROWSERS_CONF[browser];
    if (!browserConf) {
        throw new Error(`No browser config for: "${browser}"`);
    }
    return browserConf;
};

const pJson = require('../package.json');

/**
 * Version from package.json, or the dev fallback when the field is absent.
 * The version is intentionally not committed (like AGLint): CI stamps it
 * before every build (set-dev-version / publish tag), so only local dev
 * builds see the fallback.
 *
 * @returns Package version string.
 */
export const getPackageVersion = (): string => String(pJson.version || '0.0.0');

/**
 * Store-compatible version: CWS / AMO listed / Edge reject `-beta.N`.
 * `1.2.0-beta.1` → `1.2.0`.
 *
 * @param version Version from package.json or CHANGELOG.
 *
 * @returns Numeric core without a pre-release suffix.
 */
export const toStoreVersion = (version: string): string => String(version).split('-')[0];

/**
 * Chrome/Edge beta version: stores reject `-beta.N`, but stripping it
 * entirely collides successive betas (CWS duplicate version) and stops
 * `update.xml` from offering beta.2 to beta.1. The manifest version scheme
 * allows a fourth numeric component, so `1.2.0-beta.1` → `1.2.0.1`. Note
 * that `1.2.0.1` compares numerically newer than the plain `1.2.0` release;
 * superseding never matters in practice because beta and release ship as
 * separate listings with separate update.xml files.
 *
 * @param version Version from package.json or CHANGELOG.
 *
 * @returns Store-compatible numeric beta, or the store version otherwise.
 */
export const toChromeBetaVersion = (version: string): string => {
    const match = String(version).match(/^(\d+\.\d+\.\d+)-beta\.(\d+)$/);
    if (!match) {
        return toStoreVersion(version);
    }
    return `${match[1]}.${match[2]}`;
};

/**
 * Firefox toolkit version for self-hosted beta XPIs.
 * `1.2.0-beta.1` → `1.2.0beta1`, which sorts beta.1 < beta.2 < 1.2.0 so
 * `update.json` can offer successive betas and the eventual release still
 * supersedes them. Chrome/CWS cannot use this form.
 *
 * @param version Version from package.json or CHANGELOG.
 *
 * @returns Toolkit version for Firefox beta, or the store version otherwise.
 */
export const toFirefoxBetaVersion = (version: string): string => {
    const match = String(version).match(/^(\d+\.\d+\.\d+)-beta\.(\d+)$/);
    if (!match) {
        return toStoreVersion(version);
    }
    return `${match[1]}beta${match[2]}`;
};

export const updateManifest = (
    manifestJson: Buffer,
    browserManifestDiff: { [key: string]: unknown },
    browser: Browser = Browser.Chrome,
): Buffer => {
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

    const rawVersion = getPackageVersion();
    let version = toStoreVersion(rawVersion);
    if (IS_BETA) {
        version = browser === Browser.Firefox
            ? toFirefoxBetaVersion(rawVersion)
            : toChromeBetaVersion(rawVersion);
    }

    const updatedManifest = {
        ...union,
        permissions,
        version,
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

/**
 * Formats extension name for manifest.
 *
 * @param name Extension name to use.
 * @param env Build environment.
 *
 * @returns Formatted extension name.
 */
const formatMsgName = (name: string, env: string): string => {
    return `${name} ${env}`;
};

export const updateLocalesMSGName = (content: Buffer, env: string): string => {
    // Chrome Web Store allows only 45 symbol long names
    const NAME_MAX_LENGTH = 45;
    const envData = BUILD_ENV_MAP[env];

    if (!envData) {
        throw new Error(`Wrong environment: ${env}`);
    }

    const { name: envName } = envData;

    const messages = JSON.parse(content.toString());

    // for dev and beta builds use "short_name environment"
    if (env !== Env.Release) {
        messages.name.message = formatMsgName(messages.short_name.message, envName);
        return JSON.stringify(messages, null, 4);
    }

    // if name with suffix is too long, use short_name
    if (messages.name && messages.name.message.length > NAME_MAX_LENGTH) {
        messages.name.message = messages.short_name.message;

        if (messages.name.message.length > NAME_MAX_LENGTH) {
            throw new Error(`Chrome Web Store allows only ${NAME_MAX_LENGTH} symbol long names`);
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
