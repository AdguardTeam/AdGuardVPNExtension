import { AppStatus } from './AppStatus';
import { proxy } from '../proxy';
import { settings } from '../settings';
import { version } from '../../../package.json';

export const appStatus = new AppStatus(proxy, settings, version);
