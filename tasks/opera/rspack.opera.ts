import { Browser } from '../consts';
import { getChromiumRspackConfig } from '../rspack.chromium';

import { operaManifestDiff } from './manifest.opera';

export const operaConfig = getChromiumRspackConfig(Browser.Opera, operaManifestDiff);
