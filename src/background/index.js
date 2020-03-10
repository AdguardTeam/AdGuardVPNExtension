import settings from './settings/settings';
import actions from './actions';
import { vpnApi } from './api';
import tabs from './tabs';
import exclusions from './exclusions';
import auth from './auth';
import { proxy } from './proxy';
import connectivity from './connectivity';
import appStatus from './appStatus';
import authCache from './authentication/authCache';
import messaging from './messaging';
import endpoints from './endpoints/endpoints';
import credentials from './credentials';
import permissionsChecker from './permissionsChecker/permissionsChecker';
import permissionsError from './permissionsChecker/permissionsError';
import popupData from './popupData';
import log from '../lib/logger';
import nonRoutable from './routability/nonRoutable';
import management from './management';
import updateService from './updateService';
import contextMenu from './contextMenu';

global.adguard = {
    settings,
    actions,
    proxy,
    vpnApi,
    tabs,
    exclusions,
    auth,
    connectivity,
    appStatus,
    authCache,
    endpoints,
    popupData,
    permissionsChecker,
    permissionsError,
    credentials,
    nonRoutable,
    management,
};

(async () => {
    try {
        const runInfo = await updateService.getRunInfo();

        permissionsChecker.init(); // should be initiated before auth module
        await auth.init();
        await settings.init();
        await credentials.init(runInfo);
        await exclusions.init();
        await settings.applySettings(); // we have to apply settings when credentials are ready
        await nonRoutable.init();
        await contextMenu.init();
        await endpoints.init();
        messaging.init();
        log.info('Extension loaded all necessary modules');
    } catch (e) {
        log.error('Unable to start extension because of error:', e && e.message);
    }
})();
