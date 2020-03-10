import throttle from 'lodash/throttle';
import endpoints from './endpoints/endpoints';
import log from '../lib/logger';
import { SETTINGS_IDS } from '../lib/constants';
import permissionsError from './permissionsChecker/permissionsError';
import nonRoutable from './routability/nonRoutable';
import permissionsChecker from './permissionsChecker/permissionsChecker';
import { runWithCancel } from '../lib/helpers';

const throttledPermissionsChecker = throttle(permissionsChecker.checkPermissions, 2000);

const getPopupData = async (url) => {
    const isAuthenticated = await adguard.auth.isAuthenticated();
    if (!isAuthenticated) {
        return {
            isAuthenticated,
        };
    }
    const error = permissionsError.getError();
    const isRoutable = nonRoutable.isUrlRoutable(url);
    const vpnInfo = endpoints.getVpnInfo();
    const endpointsList = endpoints.getEndpoints();
    const selectedEndpoint = await endpoints.getSelectedEndpoint();
    const canControlProxy = await adguard.appStatus.canControlProxy();
    const isProxyEnabled = adguard.settings.getSetting(SETTINGS_IDS.PROXY_ENABLED);

    // If error check permissions when popup is opened, ignoring multiple retries
    if (error) {
        throttledPermissionsChecker();
    }

    return {
        permissionsError: error,
        vpnInfo,
        endpointsList,
        selectedEndpoint,
        isAuthenticated,
        canControlProxy,
        isProxyEnabled,
        isRoutable,
    };
};

const sleep = (waitTime) => new Promise((resolve) => {
    setTimeout(resolve, waitTime);
});

let retryCounter = 0;

const DEFAULT_RETRY_DELAY = 400;
function* getPopupDataRetry(url, retryNum = 1, retryDelay = DEFAULT_RETRY_DELAY) {
    const backoffIndex = 1.5;
    let data;

    try {
        data = yield getPopupData(url);
    } catch (e) {
        log.error(e);
    }

    retryCounter += 1;

    if (!data.isAuthenticated || data.permissionsError) {
        retryCounter = 0;
        return data;
    }

    const { vpnInfo, endpointsList, selectedEndpoint } = data;

    let hasRequiredData = true;

    if (!vpnInfo || !endpointsList || !selectedEndpoint) {
        if (retryNum <= 1) {
            // it may be useful to disconnect proxy if we can't get data
            if (data.isProxyEnabled) {
                yield adguard.settings.disableProxy();
            }
            retryCounter = 0;
            hasRequiredData = false;
            return { ...data, hasRequiredData };
        }
        yield sleep(retryDelay);
        log.debug(`Retry get popup data again retry: ${retryCounter}`);
        return yield* getPopupDataRetry(url, retryNum - 1, retryDelay * backoffIndex);
    }

    retryCounter = 0;
    return { ...data, hasRequiredData };
}

let cancel;
let promise;

const getPopupDataRetryWithCancel = (url, retryNum) => {
    if (cancel) {
        cancel();
        retryCounter = 0;
    }
    ({ promise, cancel } = runWithCancel(getPopupDataRetry, url, retryNum));
    return promise;
};

/**
 * If popup is closed we call this function
 * This is done because if user doesn't wait until extension gets data and closes popup,
 * then extension freezes
 */
const cancelGettingPopupData = (reason) => {
    if (cancel) {
        cancel(reason);
    }
};

export default { getPopupDataRetryWithCancel, cancelGettingPopupData };
