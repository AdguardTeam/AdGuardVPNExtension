import pJSON from '../../package.json';

// package.json carries no version on master (CI stamps it before building);
// fall back for local dev builds.
const rawVersion = 'version' in pJSON ? pJSON.version : undefined;

/**
 * Version of the extension from package.json, `0.0.0` for local dev builds.
 */
export const PACKAGE_VERSION = typeof rawVersion === 'string' && rawVersion ? rawVersion : '0.0.0';
