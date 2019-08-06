import Api from './Api';

class ProxyApi extends Api {
    GET_ENDPOINTS = { path: 'endpoints', method: 'GET' };

    getEndpoints() {
        const { path, method } = this.GET_ENDPOINTS;
        return this.makeRequest(path, method);
    }

    GET_STATS = { path: 'stats', method: 'GET' };

    // TODO [maximtop] waits real path
    getStats() {
        const { path, method } = this.GET_STATS;
        return { bandwidth: '72.16', speed: '0.97' };
        // return this.makeRequest(path, method);
    }
}

const PROXY_BASE_URL = 'http://10.7.144.39:8181/api/v1';

const proxyApi = new ProxyApi(PROXY_BASE_URL);

export default proxyApi;
