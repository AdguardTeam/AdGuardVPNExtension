import axios from 'axios';
import log from '../../lib/logger';

class Api {
    BASE_URL = 'http://10.7.144.39:8181/api/v1';

    async makeRequest(path, method = 'POST', config) {
        try {
            const response = await axios({
                url: `${this.BASE_URL}/${path}`,
                method,
                ...config,
            });
            return response.data;
        } catch (error) {
            log.error(error);
            const errorPath = `${this.BASE_URL}/${path}`;
            if (error.response) {
                throw new Error(`${errorPath} | ${error.response.data} | ${error.response.status}`);
            }
            throw new Error(`${errorPath} | ${error.message ? error.message : error}`);
        }
    }

    GET_ENDPOINTS = { path: 'endpoints', method: 'GET' };

    getEndpoints() {
        const { path, method } = this.GET_ENDPOINTS;
        return this.makeRequest(path, method);
    }
}

const api = new Api();

export default api;
