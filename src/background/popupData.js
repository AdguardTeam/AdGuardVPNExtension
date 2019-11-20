import vpn from './vpn';
import log from '../lib/logger';
import { SETTINGS_IDS } from '../lib/constants';
import permissionsError from './permissionsChecker/permissionsError';
import nonRoutable from './routability/nonRoutable';

const getPopupData = async (url) => {
    const isAuthenticated = await adguard.auth.isAuthenticated();
    if (!isAuthenticated) {
        return {
            isAuthenticated,
        };
    }
    const error = permissionsError.getError();
    const isRoutable = nonRoutable.isUrlRoutable(url);
    const vpnInfo = vpn.getVpnInfo();
    const endpoints = vpn.getEndpoints();
    const selectedEndpoint = await vpn.getSelectedEndpoint();
    const canControlProxy = await adguard.appStatus.canControlProxy();
    const isProxyEnabled = adguard.settings.getSetting(SETTINGS_IDS.PROXY_ENABLED);

    return {
        permissionsError: error,
        vpnInfo,
        endpoints,
        selectedEndpoint,
        isAuthenticated,
        canControlProxy,
        isProxyEnabled,
        isRoutable,
    };
};

const sleep = waitTime => new Promise((resolve) => {
    setTimeout(resolve, waitTime);
});

let retryCounter = 0;
const getPopupDataRetry = async (url, retryNum = 1, retryDelay = 100) => {
    const backoffIndex = 1.5;
    const data = await getPopupData(url);
    retryCounter += 1;
    if (!data.isAuthenticated || data.permissionsError) {
        retryCounter = 0;
        return data;
    }
    const { vpnInfo, endpoints, selectedEndpoint } = data;
    if (!vpnInfo || !endpoints || !selectedEndpoint) {
        if (retryNum <= 1) {
            throw new Error(`Unable to get data in ${retryCounter} retries`);
        }
        await sleep(retryDelay);
        log.debug(`Retry get popup data again retry: ${retryCounter}`);
        return getPopupDataRetry(url, retryNum - 1, retryDelay * backoffIndex);
    }
    retryCounter = 0;
    return data;
};

export default { getPopupDataRetry };
