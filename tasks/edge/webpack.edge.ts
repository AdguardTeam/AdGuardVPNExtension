import { Browser } from '../consts';
import { getChromiumWebpackConfig } from '../webpack.chromium';

import { edgeManifestDiff } from './manifest.edge';

export const chromeConfig = getChromiumWebpackConfig(Browser.Chrome, edgeManifestDiff);
