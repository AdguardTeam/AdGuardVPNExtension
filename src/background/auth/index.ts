import { fallbackApi } from '../api/fallbackApi';
import { authCache } from '../authentication';
import { flagsStorage } from '../flagsStorage';
import { forwarder } from '../forwarder';
import { notifications } from '../notifications';
import { updateService } from '../updateService';

import { WebAuth } from './WebAuth';
import { auth as authService } from './auth';

export { type AuthInterface } from './auth';

export const auth = authService;

export const webAuth = new WebAuth({
    auth: authService,
    authCache,
    flagsStorage,
    notifications,
    updateService,
    forwarder,
    fallbackApi,
});
