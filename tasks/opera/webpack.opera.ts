import { Browser } from '../consts';
import { getChromiumWebpackConfig } from '../webpack.chromium';

import { operaManifestDiff } from './manifest.opera';

export const chromeConfig = getChromiumWebpackConfig(Browser.Chrome, operaManifestDiff);
