import qs from 'qs';
import browser from 'webextension-polyfill';

import Api from './Api';
import { VPN_API_URL } from '../config';

// projects/ADGUARD/repos/adguard-vpn-backend-service/browse
class VpnApi extends Api {
    GET_LOCATIONS = { path: 'v2/locations/extension', method: 'GET' };

    getLocations = (vpnToken) => {
        const { path, method } = this.GET_LOCATIONS;
        const language = browser.i18n.getUILanguage();

        const params = {
            token: vpnToken,
            language,
        };

        return this.makeRequest(path, method, { params });
    };

    GET_VPN_CREDENTIALS = { path: 'v1/proxy_credentials', method: 'POST' };

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

    GET_CURRENT_LOCATION = { path: 'v1/geo_location', method: 'GET' };

    getCurrentLocation = () => {
        const { path, method } = this.GET_CURRENT_LOCATION;
        return this.makeRequest(path, method);
    };

    VPN_EXTENSION_INFO = { path: 'v1/info/extension', method: 'GET' };

    getVpnExtensionInfo = (vpnToken) => {
        const { path, method } = this.VPN_EXTENSION_INFO;

        const params = {
            token: vpnToken,
        };
        return this.makeRequest(path, method, { params });
    };

    TRACK_EXTENSION_INSTALL = { path: 'v1/init/extension', method: 'POST' };

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
