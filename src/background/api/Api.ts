import axios, { AxiosRequestConfig, Method } from 'axios';
// TODO: use internal axios fetch adapter after they release it instead of @vespaiach/axios-fetch-adapter
// https://github.com/axios/axios/pull/5146
import fetchAdapter from '@vespaiach/axios-fetch-adapter';

import { ERROR_STATUSES } from '../../lib/constants';
import CustomError from '../../lib/CustomError';
import { browserApi } from '../browserApi';

const REQUEST_TIMEOUT_MS = 1000 * 6; // 6 seconds

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
    makeRequest(path: string, config: ConfigInterface, method: Method): Promise<any>;
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

    async makeRequest(path: string, config: ConfigInterface, method: Method = 'POST') {
        const url = `https://${await this.getBaseUrl()}/${path}`;
        const axiosConfig: AxiosRequestConfig = {
            url,
            method,
            timeout: REQUEST_TIMEOUT_MS,
            ...config,
        };

        // in manifest version 3 fetch adapter is used for axios requests
        if (!browserApi.runtime.isManifestVersion2()) {
            axiosConfig.adapter = fetchAdapter;
        }

        try {
            const response = await axios(axiosConfig);
            return response.data;
        } catch (error: any) {
            if (error.response) {
                throw new CustomError(error.response.status, JSON.stringify(error.response.data));
            }
            throw new CustomError(ERROR_STATUSES.NETWORK_ERROR, `${url} | ${error.message || JSON.stringify(error)}`);
        }
    }
}
