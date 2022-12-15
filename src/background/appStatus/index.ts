import { AppStatus } from './AppStatus';
import { proxy } from '../proxy';
import { settings } from '../settings';
import { version } from '../../../package.json';

const ver: string = version;
debugger

export const appStatus = new AppStatus(proxy, settings, ver);
