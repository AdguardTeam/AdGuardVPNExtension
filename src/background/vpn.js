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

const reconnectEndpoint = async (endpoints) => {
    const currentEndpoint = await proxy.getCurrentEndpoint();
    const endpointsArr = Object.keys(endpoints).map(endpointKey => endpoints[endpointKey]);
    const sameCityEndpoint = endpointsArr.find((endpoint) => {
        return endpoint.cityName === currentEndpoint.cityName;
    });
    if (sameCityEndpoint) {
        await proxy.setCurrentEndpoint(sameCityEndpoint);
        return;
    }
    const closestCityEndpoint = getClosestEndpointByCoordinates(currentEndpoint, endpointsArr);
    await proxy.setCurrentEndpoint(closestCityEndpoint);
};

const getEndpointsRemotely = async () => {
    const vpnToken = await credentials.gainVpnToken();
    const token = vpnToken && vpnToken.token;
    if (!token) {
        throw new Error('was unable to get vpn token');
    }
    const endpoints = await vpnProvider.getEndpoints(token);
    vpnCache.endpoints = endpoints;
    browser.runtime.sendMessage({ type: MESSAGES_TYPES.ENDPOINTS_UPDATED, data: endpoints });
    return endpoints;
};

const vpnTokenChanged = (oldVpnToken, newVpnToken) => {
    return oldVpnToken.licenseKey !== newVpnToken.licenseKey;
};

const getVpnInfoRemotely = async () => {
    const vpnToken = await credentials.gainVpnToken();
    let vpnInfo = await vpnProvider.getVpnExtensionInfo(vpnToken.token);
    let shouldReconnect = false;

    if (vpnInfo.refreshTokens) {
        log.info('refreshing tokens');
        const updatedVpnToken = await credentials.getVpnTokenRemote();
        if (vpnTokenChanged(vpnToken, updatedVpnToken)) {
            shouldReconnect = true;
        }
        await credentials.gainVpnCredentials(true);
        vpnInfo = await vpnProvider.getVpnExtensionInfo(updatedVpnToken.token);
    }

    // update endpoints
    const endpoints = await getEndpointsRemotely();
    if (shouldReconnect) {
        await reconnectEndpoint(endpoints);
    }
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

const getCurrentLocation = () => vpnProvider.getCurrentLocation();

const vpn = {
    getEndpoints,
    getCurrentLocation,
    getVpnInfo,
};

export default vpn;
