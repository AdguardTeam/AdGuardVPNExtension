import axios from 'axios';
import { ERROR_STATUSES } from '../../lib/constants';
import CustomError from '../../lib/CustomError';

class Api {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async makeRequest(path, method = 'POST', config) {
        try {
            const response = await axios({
                url: `${this.baseUrl}${path}`,
                method,
                ...config,
            });
            return response.data;
        } catch (error) {
            const errorPath = `${this.baseUrl}${path}`;
            if (error.response) {
                throw new CustomError(error.response.status, JSON.stringify(error.response.data));
            }
            throw new CustomError(ERROR_STATUSES.NETWORK_ERROR, `${errorPath} | ${error.message || JSON.stringify(error)}`);
        }
    }
}

export default Api;
