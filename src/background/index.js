import actions from './actions';
import appStatus from './appStatus';
import auth from './auth';
import authCache from './authentication/authCache';
import connectivity from './connectivity';
import contextMenu from './contextMenu';
import credentials from './credentials';
import endpoints from './endpoints';
import exclusions from './exclusions';
import log from '../lib/logger';
import management from './management';
import messaging from './messageHandler';
import nonRoutable from './routability/nonRoutable';
import permissionsChecker from './permissionsChecker';
import permissionsError from './permissionsChecker/permissionsError';
import popupData from './popupData';
import proxy from './proxy';
import settings from './settings/settings';
import tabs from './tabs';
import updateService from './updateService';
import { vpnApi } from './api';
import browserActionIcon from './BrowserActionIcon';

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
    browserActionIcon,
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
        messaging.init();
        log.info('Extension loaded all necessary modules');
    } catch (e) {
        log.error('Unable to start extension because of error:', e && e.message);
    }
})();
