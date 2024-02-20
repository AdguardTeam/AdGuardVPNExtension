import axios from 'axios';
import _ from 'lodash';

import {
    AUTH_API_URL,
    VPN_API_URL,
    STAGE_ENV,
} from '../config';
import { clearFromWrappingQuotes } from '../../common/utils/string';
import { log } from '../../common/logger';
import { fetchConfig } from '../../common/fetch-config';
import { getErrorMessage } from '../../common/utils/error';
import { stateStorage } from '../stateStorage';
import { authService } from '../authentication/authService';
import { credentialsService } from '../credentials/credentialsService';
import { FallbackInfo, StorageKey } from '../schema';

export const DEFAULT_CACHE_EXPIRE_TIME_MS = 1000 * 60 * 5; // 5 minutes

// DNS over https api
const GOOGLE_DOH_HOSTNAME = 'dns.google';
export const GOOGLE_DOH_URL = `${GOOGLE_DOH_HOSTNAME}/resolve`;

const CLOUDFLARE_DOH_HOSTNAME = 'cloudflare-dns.com';
export const CLOUDFLARE_DOH_URL = `${CLOUDFLARE_DOH_HOSTNAME}/dns-query`;

const ALIDNS_DOH_HOSTNAME = 'dns.alidns.com';
export const ALIDNS_DOH_URL = `${ALIDNS_DOH_HOSTNAME}/resolve`;

const stageSuffix = STAGE_ENV === 'test' ? '-dev' : '';
const BKP_API_HOSTNAME_PART = `bkp-api${stageSuffix}.adguard-vpn.online`;
const BKP_AUTH_HOSTNAME_PART = `bkp-auth${stageSuffix}.adguard-vpn.online`;

const EMPTY_BKP_URL = 'none';

const REQUEST_TIMEOUT_MS = 3 * 1000;

const enum UserType {
    NotAuthenticated = 'anon',
    Free = 'free',
    Premium = 'pro',
}

const WHOAMI_VERSION = 'v1';
const APPLICATION_TYPE = 'at-ext';

export class FallbackApi {
    /**
     * Default fallback info, it may be used if doh returns none result
     * We keep all fallback info in one object, because it's easier to work with
     * Also, vpnApiUrl and authApiUrl always are updated in pairs
     */
    defaultFallbackInfo: FallbackInfo;

    /**
     * Default urls we set already expired,
     * so we need to check bkp url immediately when bkp url is required
     */
    constructor(vpnApiUrl: string, authApiUrl: string) {
        this.defaultFallbackInfo = {
            vpnApiUrl,
            authApiUrl,
            expiresInMs: Date.now() - 1,
        };
    }

    private get fallbackInfo(): FallbackInfo {
        return stateStorage.getItem(StorageKey.FallbackInfo);
    }

    private set fallbackInfo(value: FallbackInfo) {
        stateStorage.setItem(StorageKey.FallbackInfo, value);
    }

    public async init(): Promise<void> {
        if (!this.fallbackInfo) {
            await this.updateFallbackInfo();
        }
    }

    private static needsUpdate(fallbackInfo: FallbackInfo): boolean {
        return fallbackInfo.expiresInMs < Date.now();
    }

    private async updateFallbackInfo() {
        const [bkpVpnApiUrl, bkpAuthApiUrl] = await Promise.all([
            this.getBkpVpnApiUrl(),
            this.getBkpAuthApiUrl(),
        ]);

        if (bkpVpnApiUrl && bkpAuthApiUrl) {
            this.fallbackInfo = {
                vpnApiUrl: bkpVpnApiUrl,
                authApiUrl: bkpAuthApiUrl,
                expiresInMs: Date.now() + DEFAULT_CACHE_EXPIRE_TIME_MS,
            };
        }
    }

    private async getFallbackInfo(): Promise<FallbackInfo> {
        if (this.fallbackInfo && FallbackApi.needsUpdate(this.fallbackInfo)) {
            await this.updateFallbackInfo();
            if (this.fallbackInfo) {
                return this.fallbackInfo;
            }
        }

        return this.fallbackInfo || this.defaultFallbackInfo;
    }

    public getVpnApiUrl = async (): Promise<string> => {
        const fallbackInfo = await this.getFallbackInfo();
        return fallbackInfo.vpnApiUrl;
    };

    public getAuthApiUrl = async (): Promise<string> => {
        const fallbackInfo = await this.getFallbackInfo();
        return fallbackInfo.authApiUrl;
    };

    public getAuthBaseUrl = async (): Promise<string> => {
        const authApiUrl = await this.getAuthApiUrl();
        return `${authApiUrl}/oauth/authorize`;
    };

    public getAuthRedirectUri = async (): Promise<string> => {
        const authApiUrl = await this.getAuthApiUrl();
        return `${authApiUrl}/oauth.html?adguard-vpn=1`;
    };

    public getAccountApiUrl = async (): Promise<string> => {
        const vpnApiUrl = await this.getVpnApiUrl();
        return `${vpnApiUrl}/account`;
    };

    public getApiUrlsExclusions = async (): Promise<string[]> => {
        return [
            await this.getVpnApiUrl(),
            await this.getAuthApiUrl(),
            GOOGLE_DOH_HOSTNAME,
            CLOUDFLARE_DOH_HOSTNAME,
            ALIDNS_DOH_HOSTNAME,
        ].map((url) => `*${url}`);
    };

    private getBkpUrlByGoogleDoh = async (name: string): Promise<string> => {
        const { data } = await axios.get(`https://${GOOGLE_DOH_URL}`, {
            headers: {
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
            },
            params: {
                name,
                type: 'TXT',
            },
            timeout: REQUEST_TIMEOUT_MS,
            ...fetchConfig,
        });

        const bkpUrl = _.get(data, 'Answer[0].data');

        if (!FallbackApi.isString(bkpUrl)) {
            throw new Error(`Invalid bkp url from google doh for ${name}`);
        }

        return bkpUrl;
    };

    private getBkpUrlByCloudFlareDoh = async (name: string): Promise<string> => {
        const { data } = await axios.get(`https://${CLOUDFLARE_DOH_URL}`, {
            headers: {
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
                accept: 'application/dns-json',
            },
            params: {
                name,
                type: 'TXT',
            },
            timeout: REQUEST_TIMEOUT_MS,
            ...fetchConfig,
        });

        const bkpUrl = _.get(data, 'Answer[0].data');

        if (!FallbackApi.isString(bkpUrl)) {
            throw new Error(`Invalid bkp url from cloudflare doh for ${name}`);
        }

        return bkpUrl;
    };

    private getBkpUrlByAliDnsDoh = async (name: string): Promise<string> => {
        const { data } = await axios.get(`https://${ALIDNS_DOH_URL}`, {
            headers: {
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
                accept: 'application/dns-json',
            },
            params: {
                name,
                type: 'TXT',
            },
            timeout: REQUEST_TIMEOUT_MS,
            ...fetchConfig,
        });

        const bkpUrl = _.get(data, 'Answer[0].data');

        if (!FallbackApi.isString(bkpUrl)) {
            throw new Error(`Invalid bkp url from alidns doh for ${name}`);
        }

        return bkpUrl;
    };

    /**
     * Logs errors in the function and re-throws them to ensure that Promise.any receives them
     * @param fn Function to call
     * @throws Error
     */
    private debugErrors = async (fn: () => Promise<string>): Promise<string> => {
        try {
            const res = await fn();
            return res;
        } catch (error) {
            // Usually it's either a network error or response is empty. We don't want to spam logs with such errors,
            // that's why we only print them for debugging.
            log.debug(`Error in function ${fn.name}:`, getErrorMessage(error));
            throw error; // Re-throwing the error to ensure that Promise.any receives it
        }
    };

    private getBkpUrl = async (hostname: string): Promise<null | string> => {
        let bkpUrl;

        try {
            bkpUrl = await Promise.any([
                this.debugErrors(() => this.getBkpUrlByGoogleDoh(hostname)),
                this.debugErrors(() => this.getBkpUrlByCloudFlareDoh(hostname)),
                this.debugErrors(() => this.getBkpUrlByAliDnsDoh(hostname)),
            ]);
            bkpUrl = clearFromWrappingQuotes(bkpUrl);
        } catch (e) {
            log.error(e);
            bkpUrl = null;
        }

        return bkpUrl;
    };

    getApiHostnamePrefix = async () => {
        const basePrefix = `${WHOAMI_VERSION}.${APPLICATION_TYPE}`;

        const isAuthenticated = await authService.isAuthenticated();
        if (!isAuthenticated) {
            return `${basePrefix}.${UserType.NotAuthenticated}`;
        }

        const isPremiumUser = await credentialsService.isPremiumUser();
        if (isPremiumUser) {
            return `${basePrefix}.${UserType.Premium}`;
        }

        return `${basePrefix}.${UserType.Free}`;
    };

    getBkpVpnApiUrl = async () => {
        const prefix = await this.getApiHostnamePrefix();
        // we use prefix for api hostname to recognize free, premium and not authenticated users
        const hostname = `${prefix}.${BKP_API_HOSTNAME_PART}`;
        const bkpApiUrl = await this.getBkpUrl(hostname);
        if (bkpApiUrl === EMPTY_BKP_URL) {
            return this.defaultFallbackInfo.vpnApiUrl;
        }
        return bkpApiUrl;
    };

    getBkpAuthApiUrl = async () => {
        const prefix = await this.getApiHostnamePrefix();
        // we use prefix for auth api hostname to recognize free, premium and not authenticated users
        const hostname = `${prefix}.${BKP_AUTH_HOSTNAME_PART}`;

        const bkpAuthUrl = await this.getBkpUrl(hostname);
        if (bkpAuthUrl === EMPTY_BKP_URL) {
            return this.defaultFallbackInfo.authApiUrl;
        }

        return bkpAuthUrl;
    };

    private static isString(val: unknown): boolean {
        return typeof val === 'string';
    }
}

export const fallbackApi = new FallbackApi(VPN_API_URL, AUTH_API_URL);
