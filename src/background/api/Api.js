import axios from 'axios';

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
            throw new Error(`${errorPath} | ${error.message || error}`);
        }
    }
}

export default Api;
