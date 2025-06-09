import { notifier } from '../../common/notifier';
import { ERROR_STATUSES } from '../constants';

import { CustomError } from './CustomError';

const REQUEST_TIMEOUT_MS = 1000 * 6; // 6 seconds

const HTTP_RESPONSE_STATUS_OK = 200;

/**
 * Request config.
 */
export interface ConfigInterface {
    /**
     * Query parameters to append to the request URL.
     */
    params?: Record<string, string>;

    /**
     * Body of the request.
     */
    body?: string | FormData;

    /**
     * Headers to include in the request.
     */
    headers?: {
        Authorization?: string,
        'Content-Type'?: string,
    };

    /**
     * Flag to indicate whether to trigger a server error notification
     * in case if server is unavailable or network error occurs.
     * Default is `true`.
     */
    shouldTriggerServerErrorEvent?: boolean;
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

        const { body, headers, shouldTriggerServerErrorEvent = true } = config;

        if (body) {
            fetchConfig.body = body;
        }

        if (headers) {
            fetchConfig.headers = headers;
        }

        try {
            const response = await fetch(requestUrl, fetchConfig);
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    // server error response may be empty
                    // e.g. on auth protected routes
                    // it may send 401 with empty body
                    // and response.json() can throw an error
                    throw new CustomError(response.status, JSON.stringify(e));
                }
                throw new CustomError(response.status, JSON.stringify(errorData));
            }

            if (config.body instanceof FormData) {
                return response;
            }

            let responseData;
            try {
                responseData = await response.json();
            } catch (e) {
                // server response may be empty,
                // e.g. 'api/2.0/resend_confirmation_code' response is 200 but may be empty,
                // that's why response.json() can throw an error
                if (response.status !== HTTP_RESPONSE_STATUS_OK) {
                    throw new CustomError(response.status, JSON.stringify(e));
                }
            }
            return responseData;
        } catch (e) {
            if (e instanceof CustomError) {
                throw e;
            }

            // if server is unavailable or network error occurs
            // we should notify listeners about server error,
            // but only if the user is online and the event is not suppressed
            if (shouldTriggerServerErrorEvent && navigator.onLine) {
                notifier.notifyListeners(notifier.types.SERVER_ERROR);
            }
            throw new CustomError(ERROR_STATUSES.NETWORK_ERROR, `${requestUrl} | ${e.message || JSON.stringify(e)}`);
        } finally {
            clearTimeout(timeoutId);
        }
    }
}
