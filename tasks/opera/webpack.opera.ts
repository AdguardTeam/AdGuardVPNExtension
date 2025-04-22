import { Browser } from '../consts';
import { getChromiumWebpackConfig } from '../webpack.chromium';

import { operaManifestDiff } from './manifest.opera';

export const operaConfig = getChromiumWebpackConfig(Browser.Opera, operaManifestDiff);
