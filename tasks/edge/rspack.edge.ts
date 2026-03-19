import { Browser } from '../consts';
import { getChromiumRspackConfig } from '../rspack.chromium';

import { edgeManifestDiff } from './manifest.edge';

export const edgeConfig = getChromiumRspackConfig(Browser.Edge, edgeManifestDiff);
