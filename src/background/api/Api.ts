import axios, { AxiosRequestConfig } from 'axios';

import { ERROR_STATUSES } from '../../lib/constants';
import CustomError from '../../lib/CustomError';

interface ConfigInterface {
    params?: {
        app_id?: string;
        token?: string;
        locale?: string;
        service_id?: string | null;
    };
    data?: string | FormData;
}

interface ApiInterface {
    baseUrlFn: () => Promise<string>,
    baseUrlStr: string,
    getBaseUrl(): Promise<string>,
    makeRequest(path: string, config: ConfigInterface, method: string): Promise<any>
}

export class Api implements ApiInterface {
    baseUrlFn: () => Promise<string>;

    baseUrlStr: string;

    constructor(baseUrl: () => Promise<string>) {
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
        const url = `https://${await this.getBaseUrl()}/${path}`;
        try {
            const response = await axios({
                url,
                method,
                ...config,
            } as AxiosRequestConfig);
            return response.data;
        } catch (error: any) {
            if (error.response) {
                throw new CustomError(error.response.status, JSON.stringify(error.response.data));
            }
            throw new CustomError(ERROR_STATUSES.NETWORK_ERROR, `${url} | ${error.message || JSON.stringify(error)}`);
        }
    }
}
