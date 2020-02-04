import qs from 'qs';
import Api from './Api';
import { VPN_API_URL } from '../config';

// https://bit.adguard.com/projects/ADGUARD/repos/adguard-vpn-backend-service/browse
class VpnApi extends Api {
    GET_ENDPOINTS = { path: 'endpoints', method: 'GET' };

    getEndpoints = (vpnToken) => {
        const { path, method } = this.GET_ENDPOINTS;
        const params = {
            token: vpnToken,
        };
        return this.makeRequest(path, method, { params });
    };

    GET_VPN_CREDENTIALS = { path: 'proxy_credentials', method: 'POST' };

    getVpnCredentials = (appId, vpnToken) => {
        const { path, method } = this.GET_VPN_CREDENTIALS;

        const data = {
            app_id: appId,
            token: vpnToken,
        };

        const config = {
            data: qs.stringify(data),
        };

        return this.makeRequest(path, method, config);
    };

    GET_CURRENT_LOCATION = { path: 'geo_location', method: 'GET' };

    getCurrentLocation = () => {
        const { path, method } = this.GET_CURRENT_LOCATION;
        return this.makeRequest(path, method);
    };

    VPN_EXTENSION_INFO = { path: 'info/extension', method: 'GET' };

    getVpnExtensionInfo = (vpnToken) => {
        const { path, method } = this.VPN_EXTENSION_INFO;

        const params = {
            token: vpnToken,
        };
        return this.makeRequest(path, method, { params });
    };

    TRACK_EXTENSION_INSTALL = { path: 'init/extension', method: 'POST' };

    postExtensionInstalled = (appId) => {
        const { path, method } = this.TRACK_EXTENSION_INSTALL;

        const config = {
            data: qs.stringify({
                app_id: appId,
            }),
        };

        return this.makeRequest(path, method, config);
    }
}

const vpnApi = new VpnApi(VPN_API_URL);

export default vpnApi;
