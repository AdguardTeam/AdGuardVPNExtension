import { authCache } from '../authentication';
import { flagsStorage } from '../flagsStorage';
import { notifier } from '../../common/notifier';
import { tabs } from '../tabs';
import { WindowsApi } from '../windowsApi';
import { fallbackApi } from '../api/fallbackApi';

import { auth as authService } from './auth';
import { WebAuth } from './WebAuth';

export { type AuthInterface } from './auth';

export const auth = authService;

export const webAuth = new WebAuth({
    auth: authService,
    authCache,
    flagsStorage,
    fallbackApi,
    notifier,
    tabs,
    windowsApi: WindowsApi,
});
