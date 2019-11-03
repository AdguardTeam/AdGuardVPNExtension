import axios from 'axios';
import { NETWORK_ERROR } from '../../lib/constants';

class ApiError extends Error {
    constructor(status, ...params) {
        super(...params);
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApiError);
        }
        this.name = 'ApiError';
        // Custom debugging information
        this.status = status;
    }
}

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
            const errorPath = `${this.baseUrl}/${path}`;
            if (error.response) {
                throw new ApiError(error.status, JSON.stringify(error.response.data));
            }
            throw new ApiError(NETWORK_ERROR, `${errorPath} | ${error.message || JSON.stringify(error)}`);
        }
    }
}

export default Api;
