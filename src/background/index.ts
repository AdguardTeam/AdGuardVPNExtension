import actions from './actions';
import appStatus from './appStatus';
import auth from './auth';
import authCache from './authentication/authCache';
import connectivity from './connectivity';
import { contextMenu } from './contextMenu';
import credentials from './credentials';
import { endpoints } from './endpoints';
import { exclusions } from './exclusions';
import { log } from '../lib/logger';
import management from './management';
import { messaging } from './messaging';
import nonRoutable from './routability/nonRoutable';
import permissionsChecker from './permissionsChecker';
import permissionsError from './permissionsChecker/permissionsError';
import popupData from './popupData';
import { proxy } from './proxy';
import { settings } from './settings';
import tabs from './tabs';
import { updateService } from './updateService';
import { vpnApi } from './api';
import browserActionIcon from './browserActionIcon';
import { openThankYouPage } from './postinstall';
import { endpointsTldExclusions } from './proxy/endpointsTldExclusions';
import { logStorage } from '../lib/log-storage';
import { fallbackApi } from './api/fallbackApi';
import { flagsStorage } from './flagsStorage';

import './rateModal';
import './networkConnectionObserver';
import './uninstall';

declare global {
    module globalThis {
        // eslint-disable-next-line no-var,vars-on-top
        var adguard: any;
    }
}

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
    logStorage,
};

(async () => {
    log.info(`Starting AdGuard VPN ${appStatus.appVersion}`);
    try {
        messaging.init(); // messaging is on the top, for popup be able to communicate with back
        await fallbackApi.init();
        await proxy.init();
        await updateService.init();
        await openThankYouPage();
        await flagsStorage.init();
        await credentials.init();
        permissionsChecker.init(); // should be initiated before auth module
        await auth.init();
        await settings.init();
        await exclusions.init();
        await endpointsTldExclusions.init();
        settings.applySettings(); // we have to apply settings when credentials are ready
        endpoints.init(); // update endpoints list on extension or browser restart
        await nonRoutable.init();
        contextMenu.init();
        browserActionIcon.init();
        log.info('Extension loaded all necessary modules');
    } catch (e: any) {
        log.error('Unable to start extension because of error:', e && e.message);
    }
})();
