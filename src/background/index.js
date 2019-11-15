import settings from './settings/settings';
import actions from './actions';
import { vpnApi } from './api';
import tabs from './tabs';
import exclusions from './exclusions';
import auth from './auth';
import { proxy } from './proxy';
import connectivity from './connectivity/connectivity';
import appStatus from './appStatus';
import authCache from './authentication/authCache';
import messaging from './messaging';
import vpn from './vpn';
import popupData from './popupData';
import credentials from './credentials';
import permissionsUpdater from './permissionsUpdater';
import ip from './ip';
import log from '../lib/logger';
import storage from './storage';

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
    vpn,
    ip,
    popupData,
    credentials,
    storage,
};

(async () => {
    await settings.init();
    await credentials.init();
    await exclusions.init();
    await settings.applySettings(); // we have to apply settings when credentials are ready
    messaging.init();
    permissionsUpdater.init();
    log.info('Extension loaded all necessary modules');
})();
