import { AppStatus } from './AppStatus';
import { proxy } from '../proxy';
import { settings } from '../settings';
import pJSON from '../../../package.json';

export const appStatus = new AppStatus(proxy, settings, pJSON.version);
