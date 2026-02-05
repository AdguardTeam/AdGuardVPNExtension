import { Browser } from '../consts';
import { getChromiumRspackConfig } from '../rspack.chromium';

import { chromeManifestDiff } from './manifest.chrome';

export const chromeConfig = getChromiumRspackConfig(Browser.Chrome, chromeManifestDiff);
