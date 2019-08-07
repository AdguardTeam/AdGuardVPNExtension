import axios from 'axios';
import log from '../../lib/logger';

class Api {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async makeRequest(path, method = 'POST', config) {
        try {
            const response = await axios({
                url: `${this.baseUrl}/${path}`,
                method,
                ...config,
            });
            return response.data;
        } catch (error) {
            log.error(error);
            const errorPath = `${this.baseUrl}/${path}`;
            if (error.response) {
                throw new Error(JSON.stringify(error.response.data));
            }
            throw new Error(`${errorPath} | ${error.message || error}`);
        }
    }
}

export default Api;
