import { proxy } from '../proxy';
import { settings } from '../settings';
import pJSON from '../../../package.json';

import { AppStatus } from './AppStatus';

export const appStatus = new AppStatus(proxy, settings, pJSON.version);
