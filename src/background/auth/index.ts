import { authCache } from '../authentication';
import { flagsStorage } from '../flagsStorage';
import { fallbackApi } from '../api/fallbackApi';
import { notifier } from '../../common/notifier';
import { notifications } from '../notifications';
import { updateService } from '../updateService';
import { forwarder } from '../forwarder';
import { tabs } from '../tabs';
import { WindowsApi } from '../windowsApi';

import { auth as authService } from './auth';
import { WebAuth } from './WebAuth';
import { AuthSideEffects } from './AuthSideEffects';

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

export const authSideEffects = new AuthSideEffects({
    notifier,
    notifications,
    updateService,
    forwarder,
    tabs,
});
