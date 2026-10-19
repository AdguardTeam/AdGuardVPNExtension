import { proxy } from '../proxy';
import { settings } from '../settings';
import { PACKAGE_VERSION } from '../version';

import { AppStatus } from './AppStatus';

export const appStatus = new AppStatus(proxy, settings, PACKAGE_VERSION);
