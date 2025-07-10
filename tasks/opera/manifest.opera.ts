import { chromeManifestDiff } from '../chrome/manifest.chrome';
import { MIN_SUPPORTED_VERSION } from '../consts';

/**
 * Opera manifest diff.
 *
 * Basically the same as Chrome Manifest.
 */
export const operaManifestDiff = {
    // Opera version matches Chromium version
    minimum_opera_version: String(MIN_SUPPORTED_VERSION.CHROMIUM),
    ...chromeManifestDiff,
};
