import { Browser } from '../consts';
import { getChromiumWebpackConfig } from '../webpack.chromium';

import { chromeManifestDiff } from './manifest.chrome';

export const chromeConfig = getChromiumWebpackConfig(Browser.Chrome, chromeManifestDiff);
