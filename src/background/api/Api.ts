import { ERROR_STATUSES } from '../../lib/constants';
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
    makeRequest(path: string, method: string, config: ConfigInterface): Promise<unknown>;
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
     * A method that makes an asynchronous fetch request to the specified path with the given configuration.
     *
     * @param {string} path - The path to which the fetch request will be made.
     * @param {Method} [method='POST'] - The HTTP method for the fetch request. Default is 'POST'.
     * @param {ConfigInterface} [config={}] config - The configuration object for the fetch request.
     * @returns {Promise<Response>} A Promise that resolves to a Response object
     * representing the response to the fetch request.
     * @throws {CustomError} A custom error object with the status code and error message if the fetch request fails.
     */
    async makeRequest(path: string, method: string = 'POST', config: ConfigInterface = {}) {
        const url = await this.getRequestUrl(path);

        const controller = new AbortController();
        const { signal } = controller;
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        const fetchConfig: RequestInit = {
            method,
            signal,
            ...config,
        };

        try {
            const response = await fetch(url, fetchConfig);
            if (config.body instanceof FormData) {
                return response;
            }
            return await response.json();
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
        } finally {
            clearTimeout(timeoutId);
        }
    }
}
