import axios, { AxiosRequestConfig, Method } from 'axios';

import { ERROR_STATUSES, fetchConfig } from '../../lib/constants';
import { CustomError } from '../../lib/CustomError';
import { notifier } from '../../lib/notifier';

const REQUEST_TIMEOUT_MS = 1000 * 6; // 6 seconds

interface ConfigInterface {
    params?: {
        app_id?: string;
        token?: string;
        locale?: string;
        service_id?: string | null;
    };
    data?: string | FormData;
    body?: string | FormData;
    headers?: {
        Authorization: string,
    };
}

interface ApiInterface {
    makeRequest(path: string, config: ConfigInterface, method: Method): Promise<unknown>;
}

export class Api implements ApiInterface {
    baseUrlFn: () => Promise<string>;

    baseUrlStr: string;

    constructor(baseUrl: string | (() => Promise<string>)) {
        if (typeof baseUrl === 'function') {
            this.baseUrlFn = baseUrl;
        } else {
            this.baseUrlStr = baseUrl;
        }
    }

    async getBaseUrl(): Promise<string> {
        if (this.baseUrlFn) {
            const baseUrlStr = await this.baseUrlFn();
            return baseUrlStr;
        }
        return this.baseUrlStr;
    }

    private getRequestUrl = async (path: string): Promise<string> => `https://${await this.getBaseUrl()}/${path}`;

    /**
     * A method that makes an asynchronous Axios request to the specified path with the given configuration.
     *
     * @param {string} path - The path to which the request will be made.
     * @param {ConfigInterface} config - The configuration object for the request.
     * @param {Method} [method='POST'] - The HTTP method for the request. Default is 'POST'.
     * @returns {Promise<any>} A Promise that resolves to the response data from the server.
     * @throws {CustomError} A custom error object with the status code and error message if the request fails.
     */
    async makeRequest(path: string, config: ConfigInterface, method: Method = 'POST') {
        const url = await this.getRequestUrl(path);
        const axiosConfig: AxiosRequestConfig = {
            url,
            method,
            timeout: REQUEST_TIMEOUT_MS,
            ...fetchConfig,
            ...config,
        };

        try {
            const response = await axios(axiosConfig);
            return response.data;
        } catch (e) {
            if (e.response) {
                throw new CustomError(e.response.status, JSON.stringify(e.response.data));
            }
            // if there is no response from backend and network is online,
            // notify about server error
            if (navigator.onLine) {
                notifier.notifyListeners(notifier.types.SERVER_ERROR);
            }
            throw new CustomError(ERROR_STATUSES.NETWORK_ERROR, `${url} | ${e.message || JSON.stringify(e)}`);
        }
    }

    /**
     * A method that makes an asynchronous fetch request to the specified path with the given configuration.
     *
     * @param {string} path - The path to which the fetch request will be made.
     * @param {ConfigInterface} config - The configuration object for the fetch request.
     * @param {Method} [method='POST'] - The HTTP method for the fetch request. Default is 'POST'.
     * @returns {Promise<Response>} A Promise that resolves to a Response object
     * representing the response to the fetch request.
     * @throws {CustomError} A custom error object with the status code and error message if the fetch request fails.
     */
    async makeFetchRequest(path: string, config: ConfigInterface, method: Method = 'POST') {
        const url = await this.getRequestUrl(path);
        const fetchConfig: RequestInit = {
            method,
            ...config,
        };

        try {
            return await fetch(url, fetchConfig);
        } catch (e) {
            if (e.response) {
                throw new CustomError(e.response.status, JSON.stringify(e.response.data));
            }
            // if there is no response from backend and network is online,
            // notify about server error
            if (navigator.onLine) {
                notifier.notifyListeners(notifier.types.SERVER_ERROR);
            }
            throw new CustomError(ERROR_STATUSES.NETWORK_ERROR, `${url} | ${e.message || JSON.stringify(e)}`);
        }
    }
}
