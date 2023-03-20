import { actions } from './actions';
import { appStatus } from './appStatus';
import { auth } from './auth';
import { authCache } from './authentication';
import { connectivity } from './connectivity';
import { contextMenu } from './contextMenu';
import { credentials } from './credentials';
import { endpoints } from './endpoints';
import { exclusions } from './exclusions';
import { log } from '../lib/logger';
import { management } from './management';
import { messaging } from './messaging';
import { nonRoutable } from './routability/nonRoutable';
import { permissionsChecker } from './permissionsChecker';
import { permissionsError } from './permissionsChecker/permissionsError';
import { popupData } from './popupData';
import { proxy } from './proxy';
import { settings } from './settings';
import { tabs } from './tabs';
import { updateService } from './updateService';
import { vpnApi } from './api';
import { browserActionIcon } from './browserActionIcon';
import { openThankYouPage } from './postinstall';
import { endpointsTldExclusions } from './proxy/endpointsTldExclusions';
import { logStorage } from '../lib/log-storage';
import { fallbackApi } from './api/fallbackApi';
import { flagsStorage } from './flagsStorage';
import { browserApi } from './browserApi';
import { sessionState } from './sessionStorage';

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

if (!browserApi.runtime.isManifestVersion2()) {
    // messaging and context menu inits are on the top-level
    // because popup should be able to wake up the service worker
    messaging.init();
    contextMenu.init();
}

(async () => {
    log.info(`Starting AdGuard VPN ${appStatus.appVersion}`);
    try {
        const initStartDate = Number(new Date());
        await sessionState.init();

        if (browserApi.runtime.isManifestVersion2()) {
            messaging.init(); // messaging is on the top, for popup be able to communicate with back
        }

        // FIXME: remove temp date variable before merge
        const tempDate0 = Number(new Date());

        await fallbackApi.init();
        await proxy.init();

        // FIXME: remove temp date variable before merge
        const tempDate1 = Number(new Date());

        await updateService.init();

        // FIXME: remove temp date variable before merge
        const tempDate2 = Number(new Date());

        await openThankYouPage();
        await flagsStorage.init();

        // FIXME: remove temp date variable before merge
        const tempDate3 = Number(new Date());

        await credentials.init();

        // FIXME: remove temp date variable before merge
        const tempDate4 = Number(new Date());

        permissionsChecker.init(); // should be initiated before auth module
        await auth.init();

        // FIXME: remove temp date variable before merge
        const tempDate5 = Number(new Date());

        await settings.init();

        // FIXME: remove temp date variable before merge
        const tempDate6 = Number(new Date());

        await exclusions.init();

        // FIXME: remove temp date variable before merge
        const tempDate7 = Number(new Date());

        await endpointsTldExclusions.init();
        settings.applySettings(); // we have to apply settings when credentials are ready
        endpoints.init(); // update endpoints list on extension or browser restart

        // FIXME: remove temp date variable before merge
        const tempDate8 = Number(new Date());

        await nonRoutable.init();
        if (browserApi.runtime.isManifestVersion2()) {
            contextMenu.init();
        }
        browserActionIcon.init();
        const initDoneDate = Number(new Date());
        log.info(`Extension loaded all necessary modules in ${initDoneDate - initStartDate} ms`);

        // FIXME: remove the following logs before merge
        log.info('INIT TIMING:');
        log.info(`proxy and fallbackApi were initiated in ${tempDate1 - tempDate0} ms`);
        log.info(`updateService were initiated in ${tempDate2 - tempDate1} ms`);
        log.info(`flagsStorage were initiated in ${tempDate3 - tempDate2} ms`);
        log.info(`credentials were initiated in ${tempDate4 - tempDate3} ms`);
        log.info(`permissionsChecker and auth were initiated in ${tempDate5 - tempDate4} ms`);
        log.info(`settings were initiated in ${tempDate6 - tempDate5} ms`);
        log.info(`exclusions were initiated in ${tempDate7 - tempDate6} ms`);
        log.info(`endpointsTldExclusions and endpoints were initiated in ${tempDate8 - tempDate7} ms`);
    } catch (e) {
        log.error('Unable to start extension because of error:', e && e.message);
    }
})();
