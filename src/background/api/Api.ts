import { ERROR_STATUSES } from '../../lib/constants';
import CustomError from '../../lib/CustomError';

// const REQUEST_TIMEOUT_MS = 1000 * 6; // 6 seconds

interface ConfigInterface {
    params?: {
        app_id?: string;
        token?: string;
        locale?: string;
        service_id?: string | null;
    };
    data?: string | FormData;
    body?: string;
    headers?: {
        Authorization: string,
    };
}

interface ApiInterface {
    makeRequest(path: string, config: ConfigInterface, method: string): Promise<any>;
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

    async makeRequest(path: string, config: ConfigInterface, method: string = 'POST') {
        const params = config.data ? `?${config.data}` : '';
        const url = `https://${await this.getBaseUrl()}/${path}${params}`;

        try {
            const response = await fetch(url, {
                method,
                headers: config.headers,
            });
            const responseData = await response.json();
            return responseData;
        } catch (error: any) {
            if (error.response) {
                throw new CustomError(error.response.status, JSON.stringify(error.response.data));
            }
            throw new CustomError(ERROR_STATUSES.NETWORK_ERROR, `${url} | ${error.message || JSON.stringify(error)}`);
        }
    }
}
