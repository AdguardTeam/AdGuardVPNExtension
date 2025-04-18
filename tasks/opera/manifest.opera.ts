import { chromeManifestDiff } from '../chrome/manifest.chrome';

/**
 * Opera manifest diff.
 *
 * Basically the same as Chrome Manifest.
 */
export const operaManifestDiff = {
    minimum_opera_version: '109',
    ...chromeManifestDiff,
};
