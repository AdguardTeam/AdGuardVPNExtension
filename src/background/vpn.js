import browser from 'webextension-polyfill';
import credentials from './credentials';
import vpnProvider from './providers/vpnProvider';
import log from '../lib/logger';
import { MESSAGES_TYPES } from '../lib/constants';

const vpnCache = {
    endpoints: null,
    vpnInfo: null,
};

/**
 * Should be called only after getVpnInfo,
 * that's why we call this function in messaging module
 * @returns {Promise<void>}
 */
const getEndpointsRemotely = async () => {
    const vpnToken = await credentials.gainVpnToken();
    const token = vpnToken && vpnToken.token;
    if (!token) {
        throw new Error('was unable to get vpn token');
    }
    const endpoints = await vpnProvider.getEndpoints(token);
    vpnCache.endpoints = endpoints;
    browser.runtime.sendMessage({ type: 'vpn-saved-locally', endpoints });
};

const getVpnInfoRemotely = async () => {
    let vpnToken = await credentials.gainVpnToken();
    let vpnInfo = await vpnProvider.getVpnExtensionInfo(vpnToken.token);

    if (vpnInfo.refreshTokens) {
        log.debug('refreshing tokens');
        vpnToken = await credentials.getVpnTokenRemote();
        await credentials.gainVpnCredentials(true);
        vpnInfo = await vpnProvider.getVpnExtensionInfo(vpnToken.token);
    }

    // update endpoints
    getEndpointsRemotely();
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
    getEndpointsRemotely,
    getVpnInfo,
};

export default vpn;
