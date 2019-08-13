import qs from 'qs';
import Api from './Api';

class VpnApi extends Api {
    GET_ENDPOINTS = { path: 'endpoints', method: 'GET' };

    GET_STATS = { path: 'stats', method: 'GET' };

    GET_VPN_CREDENTIALS = { path: 'proxy_credentials', method: 'POST' };

    getEndpoints() {
        const { path, method } = this.GET_ENDPOINTS;
        return this.makeRequest(path, method);
    }

    // TODO [maximtop] waits API being ready
    getStats() {
        const { path, method } = this.GET_STATS;
        return { bandwidth: '72.16', speed: '0.97' };
        // return this.makeRequest(path, method);
    }

    getVpnCredentials(appId, vpnToken) {
        const { path, method } = this.GET_VPN_CREDENTIALS;
        const data = {
            app_id: appId,
            token: vpnToken,
        };
        const config = {
            data: qs.stringify(data),
        };
        return this.makeRequest(path, method, config);
    }
}

const VPN_API_URL = 'http://10.7.144.39:8181/api/v1';

const vpnApi = new VpnApi(VPN_API_URL);

export default vpnApi;
