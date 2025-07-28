import { chromeManifestDiff } from '../chrome/manifest.chrome';
import { MIN_SUPPORTED_VERSION } from '../consts';

/**
 * Opera manifest diff.
 *
 * Basically the same as Chrome Manifest.
 */
export const operaManifestDiff = {
    minimum_opera_version: String(MIN_SUPPORTED_VERSION.OPERA),
    ...chromeManifestDiff,
    // TODO: Remove after Opera Add-Ons store fixes the issue (AG-44559)
    short_name: '__MSG_sn__',
};
