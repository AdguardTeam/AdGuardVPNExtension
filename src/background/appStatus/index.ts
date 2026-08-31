import { proxy } from '../proxy';
import { settings } from '../settings';
import pJSON from '../../../package.json';

import { AppStatus } from './AppStatus';

// package.json carries no version on master (CI stamps it before building);
// fall back for local dev builds.
const version = (pJSON as { version?: string }).version || '0.0.0';

export const appStatus = new AppStatus(proxy, settings, version);
