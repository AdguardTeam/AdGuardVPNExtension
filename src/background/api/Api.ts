import { ERROR_STATUSES } from '../../lib/constants';
import { CustomError } from '../../lib/CustomError';
import { notifier } from '../../lib/notifier';

const REQUEST_TIMEOUT_MS = 1000 * 6; // 6 seconds

interface ConfigInterface {
    params?: {
        [key: string]: string;
    };
    data?: string | FormData;
    body?: string | FormData;
    headers?: {
        Authorization: string,
    };
}

interface ApiInterface {
    makeRequest(path: string, config: ConfigInterface, method: string): Promise<unknown>;
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

    public getRequestUrl = async (path: string): Promise<string> => `https://${await this.getBaseUrl()}/${path}`;

    /**
     * A method that makes an asynchronous Fetch request to the specified path with the given configuration.
     *
     * @param {string} path - The path to which the request will be made.
     * @param {ConfigInterface} config - The configuration object for the request.
     * @param {Method} [method='POST'] - The HTTP method for the request. Default is 'POST'.
     * @returns {Promise<any>} A Promise that resolves to the response data from the server.
     * @throws {CustomError} A custom error object with the status code and error message if the request fails.
     */
    async makeRequest(path: string, config: ConfigInterface, method = 'POST') {
        let requestUrl = await this.getRequestUrl(path);

        if (config.params) {
            const url = new URL(requestUrl);
            Object.entries(config.params).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });
            requestUrl = url.toString();
        }

        const controller = new AbortController();
        const { signal } = controller;
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        const fetchConfig: RequestInit = {
            method,
            signal,
        };

        const { body, headers } = config;

        if (body) {
            fetchConfig.body = body;
        }

        if (headers) {
            fetchConfig.headers = headers;
        }

        try {
            const response = await fetch(requestUrl, fetchConfig);
            if (!response.ok) {
                const errorData = await response.json();
                throw new CustomError(response.status, JSON.stringify(errorData));
            }

            if (config.body instanceof FormData) {
                return response;
            }

            const responseData = await response.json();
            return responseData;
        } catch (e) {
            if (e instanceof CustomError) {
                throw e;
            }

            // if there is no response from backend and network is online,
            // notify about server error
            if (navigator.onLine) {
                notifier.notifyListeners(notifier.types.SERVER_ERROR);
            }
            throw new CustomError(ERROR_STATUSES.NETWORK_ERROR, `${requestUrl} | ${e.message || JSON.stringify(e)}`);
        } finally {
            clearTimeout(timeoutId);
        }
    }
}
