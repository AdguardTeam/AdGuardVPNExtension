import axios from 'axios';
import { ERROR_STATUSES } from '../../lib/constants';
import CustomError from '../../lib/CustomError';

export class Api {
    constructor(baseUrl) {
        if (typeof baseUrl === 'function') {
            this.baseUrlFn = baseUrl;
        } else {
            this.baseUrlStr = baseUrl;
        }
    }

    async getBaseUrl() {
        if (this.baseUrlFn) {
            const baseUrlStr = await this.baseUrlFn();
            return baseUrlStr;
        }
        return this.baseUrlStr;
    }

    // eslint-disable-next-line default-param-last
    async makeRequest(path, method = 'POST', config) {
        const url = `https://${await this.getBaseUrl()}/${path}`;
        try {
            const response = await axios({
                url,
                method,
                ...config,
            });
            return response.data;
        } catch (error) {
            if (error.response) {
                throw new CustomError(error.response.status, JSON.stringify(error.response.data));
            }
            throw new CustomError(ERROR_STATUSES.NETWORK_ERROR, `${url} | ${error.message || JSON.stringify(error)}`);
        }
    }
}
