import vpn from './vpn';
import appStatus from './appStatus';
import log from '../lib/logger';
import { SETTINGS_IDS } from '../lib/constants';
import ip from './ip';

const getPopupData = async (url) => {
    const isAuthenticated = await adguard.auth.isAuthenticated();
    if (!isAuthenticated) {
        return {
            isAuthenticated,
        };
    }
    const isRoutable = ip.isUrlRoutable(url);
    const permissionsError = appStatus.getPermissionsError();
    const vpnInfo = vpn.getVpnInfo();
    const endpoints = vpn.getEndpoints();
    const selectedEndpoint = await vpn.getSelectedEndpoint();
    const canControlProxy = await adguard.appStatus.canControlProxy();
    const isProxyEnabled = adguard.settings.getSetting(SETTINGS_IDS.PROXY_ENABLED);
    return {
        permissionsError,
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

const getPopupDataRetry = async (url, retryNum = 1, retryDelay = 100) => {
    const backoffIndex = 1.5;
    const data = await getPopupData(url);
    if (!data.isAuthenticated) {
        return data;
    }
    const { vpnInfo, endpoints, selectedEndpoint } = data;
    if (!vpnInfo || !endpoints || !selectedEndpoint) {
        if (retryNum <= 1) {
            throw new Error(`Unable to get data in ${retryNum} retries`);
        }
        await sleep(retryDelay);
        log.debug('Retry get popup data again');
        return getPopupDataRetry(url, retryNum - 1, retryDelay * backoffIndex);
    }
    return data;
};

export default { getPopupData, getPopupDataRetry };
