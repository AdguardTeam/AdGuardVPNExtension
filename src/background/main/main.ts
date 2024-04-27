/**
 * This module provides initialization for modules, common for MV2 and MV3,
 * divided in two parts:
 * 1. First raw of modules with synchronous initializations, to be called on top level
 * of service worker in MV3 and background page in MV2.
 * 2. Second raw of modules with asynchronous initializations contains all other required modules.
 */
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
import { permissionsChecker } from '../permissionsChecker';
import { permissionsError } from '../permissionsChecker/permissionsError';
import { popupData } from '../popupData';
import { proxy } from '../proxy';
import { settings } from '../settings';
import { tabs } from '../tabs';
import { updateService } from '../updateService';
import { vpnApi } from '../api';
import { browserActionIcon } from '../browserActionIcon';
import { openThankYouPage } from '../postinstall';
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
import '../rateModal';
import '../networkConnectionObserver';

declare global {
    module globalThis {
        // eslint-disable-next-line no-var,vars-on-top
        var adguard: any;
    }
}

/**
 * Initiates modules synchronously and
 * adds adguard variables to the global scope.
 * This method must be invoked on the top level
 * of service worker in MV3 and background page in MV2
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
    // because popup should be able to wake up the service worker in MV3
    messaging.init();
    contextMenu.init();
    tabs.init();
};

/**
 * Initiates raw of required modules
 */
const asyncInitModules = async (): Promise<void> => {
    log.info(`Starting AdGuard VPN ${appStatus.appVersion}`);
    try {
        const initStartDate = Date.now();
        await stateStorage.init();
        connectivityService.start();
        await proxy.init();
        await fallbackApi.init();
        await updateService.init();
        await openThankYouPage();
        await flagsStorage.init();
        await auth.initState(); // auth state should be initiated before credentials init
        await credentials.init();
        permissionsChecker.init(); // should be initiated before auth module
        await auth.init();
        await locationsService.init();
        await settings.init();
        // the updateBrowserActionItems method is called after settings.init() because it uses settings
        await contextMenu.updateBrowserActionItems();
        // the checkAndSwitchStorage is called after settings.init() because it uses settings
        await logStorageManager.checkAndSwitchStorage(settings.isDebugModeEnabled());
        await exclusions.init();
        await endpointsTldExclusions.init();
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

export const main = () => {
    syncInitModules();
    asyncInitModules();
};
