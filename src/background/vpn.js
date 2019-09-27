import browser from 'webextension-polyfill';
import credentials from './credentials';
import vpnProvider from './providers/vpnProvider';
import log from '../lib/logger';
import { MESSAGES_TYPES } from '../lib/constants';
import { proxy } from './proxy';
import { getClosestEndpointByCoordinates } from '../lib/helpers';

const vpnCache = {
    endpoints: null,
    vpnInfo: null,
};

const handleReconnectEndpoint = async (endpoints) => {
    const currentEndpoint = await proxy.getCurrentEndpoint();
    const endpointsArr = Object.keys(endpoints).map(endpointKey => endpoints[endpointKey]);
    const sameCityEndpoint = endpointsArr.find((endpoint) => {
        return endpoint.cityName === currentEndpoint.cityName;
    });
    if (sameCityEndpoint) {
        proxy.setCurrentEndpoint(sameCityEndpoint);
        return;
    }
    const closestCityEndpoint = getClosestEndpointByCoordinates(currentEndpoint, endpointsArr);
    proxy.setCurrentEndpoint(closestCityEndpoint);
};

/**
 * Should be called only after getVpnInfo,
 * that's why we call this function in messaging module
 * @returns {Promise<void>}
 */
const getEndpointsRemotely = async (reconnectEndpoint) => {
    const vpnToken = await credentials.gainVpnToken();
    const token = vpnToken && vpnToken.token;
    if (!token) {
        throw new Error('was unable to get vpn token');
    }
    const endpoints = await vpnProvider.getEndpoints(token);
    if (reconnectEndpoint) {
        handleReconnectEndpoint(endpoints);
    }
    vpnCache.endpoints = endpoints;
    browser.runtime.sendMessage({ type: MESSAGES_TYPES.ENDPOINTS_UPDATED, data: endpoints });
};

const vpnTokenChanged = (oldVpnToken, newVpnToken) => {
    return oldVpnToken.licenseKey !== newVpnToken.licenseKey;
};

const getVpnInfoRemotely = async () => {
    const vpnToken = await credentials.gainVpnToken();
    let vpnInfo = await vpnProvider.getVpnExtensionInfo(vpnToken.token);
    let reconnectEndpoint = false;

    // TODO [maximtop] create tests on this module
    if (vpnInfo.refreshTokens) {
        log.info('refreshing tokens');
        const updatedVpnToken = await credentials.getVpnTokenRemote();
        if (vpnTokenChanged(vpnToken, updatedVpnToken)) {
            reconnectEndpoint = true;
        }
        await credentials.gainVpnCredentials(true);
        vpnInfo = await vpnProvider.getVpnExtensionInfo(updatedVpnToken.token);
    }

    // update endpoints
    getEndpointsRemotely(reconnectEndpoint);
    vpnCache.vpnInfo = vpnInfo;
    browser.runtime.sendMessage({ type: MESSAGES_TYPES.VPN_INFO_UPDATED, data: vpnInfo });
    return vpnInfo;
};

const getVpnInfo = () => {
    getVpnInfoRemotely();
    if (vpnCache.vpnInfo) {
        return vpnCache.vpnInfo;
    }
    return null;
};

const getEndpoints = () => {
    if (vpnCache.endpoints) {
        return vpnCache.endpoints;
    }
    return null;
};

const getCurrentLocation = async () => vpnProvider.getCurrentLocation();

const vpn = {
    getEndpoints,
    getCurrentLocation,
    getVpnInfo,
};

export default vpn;
