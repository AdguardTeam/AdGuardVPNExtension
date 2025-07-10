/**
 * This module provides initialization for modules, divided in two parts:
 * 1. First raw of modules with synchronous initializations,
 *    to be called on top level of service worker.
 * 2. Second raw of modules with asynchronous initializations
 *    contains all other required modules.
 */
import { LogLevel } from '@adguard/logger';

import { stateStorage } from '../stateStorage';
import { actions } from '../actions';
import { appStatus } from '../appStatus';
import { auth } from '../auth';
import { authCache } from '../authentication';
import { connectivity } from '../connectivity';
import { contextMenu } from '../contextMenu';
import { credentials } from '../credentials';
import { endpoints } from '../endpoints';
import { exclusions } from '../exclusions';
import { log } from '../../common/logger';
import { management } from '../management';
import { messaging } from '../messaging';
import { nonRoutable } from '../routability/nonRoutable';
import { networkConnectionObserver } from '../networkConnectionObserver';
import { permissionsChecker } from '../permissionsChecker';
import { permissionsError } from '../permissionsChecker/permissionsError';
import { popupData } from '../popupData';
import { proxy } from '../proxy';
import { settings } from '../settings';
import { tabs } from '../tabs';
import { updateService } from '../updateService';
import { vpnApi } from '../api';
import { browserActionIcon } from '../browserActionIcon';
import { openPostInstallPage } from '../postinstall';
import { endpointsTldExclusions } from '../proxy/endpointsTldExclusions';
import { logStorage } from '../../common/log-storage';
import { fallbackApi } from '../api/fallbackApi';
import { flagsStorage } from '../flagsStorage';
import { popupOpenedCounter } from '../popupData/popupOpenedCounter';
import { locationsService } from '../endpoints/locationsService';
import { connectivityService } from '../connectivity/connectivityService';
import { proxyApi } from '../proxy/abstractProxyApi';
import { updateOptionsPageListeners } from '../stateStorage/helper';
import { logStorageManager } from '../../common/log-storage/LogStorageManager';
import { setUninstallUrl } from '../uninstall';
import { telemetry } from '../telemetry';
import { rateModal } from '../rateModal';
import { runtime } from '../browserApi/runtime';
import { BROWSER, BUILD_ENV, STAGE_ENV } from '../config';
import { statisticsService } from '../statistics';

declare global {
    module globalThis {
        // eslint-disable-next-line no-var,vars-on-top
        var adguard: any;
    }
}

/**
 * Initializes synchronous modules and adds adguard variables to the global scope.
 * This method must be invoked on the top level of service worker.
 */
const syncInitModules = (): void => {
    if (!global.adguard) {
        global.adguard = {};
    }
    global.adguard = {
        ...global.adguard,
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

    // register onAuthRequired listener on the top level
    // to handle authorization for active proxy
    proxyApi.init();

    // messaging, context menu and tabs inits are on the top-level
    // because popup should be able to wake up the service worker
    messaging.init();
    contextMenu.init();
    tabs.init();
};

/**
 * Initializes asynchronous and dependant synchronous modules.
 */
const asyncInitModules = async (): Promise<void> => {
    log.info(`Starting AdGuard VPN ${appStatus.appVersion}`);
    try {
        const initStartDate = Date.now();
        await stateStorage.init();
        /**
         * Statistics service should be initiated before any other module,
         * in order to hop into first load event emission.
         */
        await statisticsService.init();
        connectivityService.start();
        await proxy.init();
        await fallbackApi.init();
        await updateService.init();
        await settings.init();
        // the consent page uses settings, so it should be initiated after settings.init()
        await openPostInstallPage();
        await flagsStorage.init();
        await auth.initState(); // auth state should be initiated before credentials init
        await credentials.init();
        permissionsChecker.init(); // should be initiated before auth module
        networkConnectionObserver.init(); // uses permissionsChecker and connectivityService
        await auth.init();
        await locationsService.init();
        await telemetry.initState();
        // the updateBrowserActionItems method is called after settings.init() because it uses settings
        await contextMenu.updateBrowserActionItems();
        // the checkAndSwitchStorage is called after settings.init() because it uses settings
        await logStorageManager.checkAndSwitchStorage(settings.isDebugModeEnabled());
        await exclusions.init();
        await endpointsTldExclusions.init();
        await rateModal.initState();
        settings.applySettings(); // we have to apply settings when credentials are ready
        endpoints.init(); // update endpoints list on extension or browser restart
        await nonRoutable.init();
        browserActionIcon.init();
        popupOpenedCounter.init();
        await updateOptionsPageListeners();
        // set uninstall url for the extension at the end
        await setUninstallUrl();
        const initDoneDate = Date.now();
        log.info(`Extension loaded all necessary modules in ${initDoneDate - initStartDate} ms`);
    } catch (e) {
        log.error('Unable to start extension because of error:', e && e.message);
    }
};

/**
 * Main function to be called on service worker start.
 */
export const main = async () => {
    if (log.currentLevel === LogLevel.Debug) {
        runtime.getPlatformOs().then((res) => {
            log.debug(`Current os: '${res}'`);
        });

        log.debug(`Current browser: "${BROWSER}"`);
        log.debug(`Current build env: "${BUILD_ENV}"`);
        log.debug(`Current stage env: "${STAGE_ENV}"`);
    }

    syncInitModules();
    await asyncInitModules();
};
