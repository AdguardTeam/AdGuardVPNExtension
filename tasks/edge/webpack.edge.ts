import { Browser } from '../consts';
import { getChromiumWebpackConfig } from '../webpack.chromium';

import { edgeManifestDiff } from './manifest.edge';

export const edgeConfig = getChromiumWebpackConfig(Browser.Edge, edgeManifestDiff);
