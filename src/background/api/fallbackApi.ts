import { browserApi } from '../browserApi';

import {
    AUTH_API_URL,
    VPN_API_URL,
    STAGE_ENV,
    WHOAMI_URL,
} from '../config';
import { clearFromWrappingQuotes } from '../../lib/string-utils';
import { log } from '../../lib/logger';
import { sessionState } from '../sessionStorage';
import { authService } from '../authentication/authService';
import { credentialsService } from '../credentials/credentialsService';
import { CountryInfo, FallbackInfo, StorageKey } from '../schema';

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

const BKP_KEY = 'bkp';

const EMPTY_BKP_URL = 'none';

const DEFAULT_COUNTRY_INFO = { country: 'none', bkp: true };

const REQUEST_TIMEOUT_MS = 3 * 1000;

type RequestParams = {
    [key: string]: string,
};

const enum Prefix {
    NotAuthenticatedUser = 'anon',
    FreeUser = 'free',
    PremiumUser = 'pro',
}

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
            countryInfo: DEFAULT_COUNTRY_INFO,
            expiresInMs: Date.now() - 1,
        };
    }

    private get fallbackInfo(): FallbackInfo {
        return sessionState.getItem(StorageKey.FallbackInfo);
    }

    private set fallbackInfo(value: FallbackInfo) {
        sessionState.setItem(StorageKey.FallbackInfo, value);
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
        const countryInfo = await this.getCountryInfo();
        const localStorageBkp = await this.getLocalStorageBkp();

        if (!countryInfo.bkp && !localStorageBkp) {
            const fallbackInfo = this.fallbackInfo || this.defaultFallbackInfo;
            // if bkp is disabled, we use previous fallback info, only update expiration time
            this.fallbackInfo = {
                ...fallbackInfo,
                expiresInMs: Date.now() + DEFAULT_CACHE_EXPIRE_TIME_MS,
            };
            return;
        }

        const [bkpVpnApiUrl, bkpAuthApiUrl] = await Promise.all([
            this.getBkpVpnApiUrl(countryInfo.country),
            this.getBkpAuthApiUrl(countryInfo.country),
        ]);

        if (bkpVpnApiUrl && bkpAuthApiUrl) {
            this.fallbackInfo = {
                vpnApiUrl: bkpVpnApiUrl,
                authApiUrl: bkpAuthApiUrl,
                countryInfo,
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
            WHOAMI_URL,
        ].map((url) => `*${url}`);
    };

    /**
     * Gets bkp flag value from local storage, used for testing purposes
     */
    private getLocalStorageBkp = async (): Promise<boolean> => {
        const storedBkp = await browserApi.storage.get(BKP_KEY);
        let localStorageBkp = Number.parseInt(String(storedBkp), 10);

        localStorageBkp = Number.isNaN(localStorageBkp) ? 0 : localStorageBkp;

        return !!localStorageBkp;
    };

    private async makeRequest(path: string, config: RequestInit = {}, params?: RequestParams) {
        const controller = new AbortController();
        const { signal } = controller;
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        let requestUrl = path;

        if (params) {
            const url = new URL(path);
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });
            requestUrl = url.toString();
        }

        const fetchConfig: RequestInit = {
            method: 'GET',
            signal,
            ...config,
        };

        const response = await fetch(requestUrl, fetchConfig);
        clearTimeout(timeoutId);
        return response.json();
    }

    private getCountryInfo = async (): Promise<CountryInfo> => {
        try {
            const data = await this.makeRequest(`https://${WHOAMI_URL}`);
            const { country, bkp } = data;
            return { country, bkp };
        } catch (e) {
            log.error(e);
            return DEFAULT_COUNTRY_INFO;
        }
    };

    private getBkpUrlByGoogleDoh = async (name: string): Promise<string> => {
        const config = {
            headers: {
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
            },
        };

        const params = {
            name,
            type: 'TXT',
        };

        const data = await this.makeRequest(`https://${GOOGLE_DOH_URL}`, config, params);

        const { Answer: [{ data: bkpUrl }] } = data;

        if (!FallbackApi.isString(bkpUrl)) {
            throw new Error('Invalid bkp url from google doh');
        }

        return bkpUrl;
    };

    private getBkpUrlByCloudFlareDoh = async (name: string): Promise<string> => {
        const config = {
            headers: {
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
                accept: 'application/dns-json',
            },
        };

        const params = {
            name,
            type: 'TXT',
        };

        const data = await this.makeRequest(`https://${CLOUDFLARE_DOH_URL}`, config, params);

        const { Answer: [{ data: bkpUrl }] } = data;

        if (!FallbackApi.isString(bkpUrl)) {
            throw new Error('Invalid bkp url from cloudflare doh');
        }

        return bkpUrl;
    };

    private getBkpUrlByAliDnsDoh = async (name: string): Promise<string> => {
        const config = {
            headers: {
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
                accept: 'application/dns-json',
            },
        };

        const params = {
            name,
            type: 'TXT',
        };

        const { data } = await this.makeRequest(`https://${ALIDNS_DOH_URL}`, config, params);

        const { Answer: [{ data: bkpUrl }] } = data;

        if (!FallbackApi.isString(bkpUrl)) {
            throw new Error('Invalid bkp url from alidns doh');
        }

        return bkpUrl;
    };

    private getBkpUrl = async (hostname: string): Promise<null | string> => {
        let bkpUrl;

        try {
            bkpUrl = await Promise.any([
                this.getBkpUrlByGoogleDoh(hostname),
                this.getBkpUrlByCloudFlareDoh(hostname),
                this.getBkpUrlByAliDnsDoh(hostname),
            ]);
            bkpUrl = clearFromWrappingQuotes(bkpUrl);
        } catch (e) {
            log.error(e);
            bkpUrl = null;
        }

        return bkpUrl;
    };

    getApiHostnamePrefix = async () => {
        const isAuthenticated = await authService.isAuthenticated();
        if (!isAuthenticated) {
            return Prefix.NotAuthenticatedUser;
        }

        const isPremiumUser = await credentialsService.isPremiumUser();
        if (isPremiumUser) {
            return Prefix.PremiumUser;
        }

        return Prefix.FreeUser;
    };

    getBkpVpnApiUrl = async (country: string) => {
        const prefix = await this.getApiHostnamePrefix();
        // we use prefix for api hostname to recognize free, premium and not authenticated users
        const hostname = `${country.toLowerCase()}.${prefix}.${BKP_API_HOSTNAME_PART}`;
        const bkpApiUrl = await this.getBkpUrl(hostname);
        if (bkpApiUrl === EMPTY_BKP_URL) {
            return this.defaultFallbackInfo.vpnApiUrl;
        }
        return bkpApiUrl;
    };

    getBkpAuthApiUrl = async (country: string) => {
        const prefix = await this.getApiHostnamePrefix();
        // we use prefix for auth api hostname to recognize free, premium and not authenticated users
        const hostname = `${country.toLowerCase()}.${prefix}.${BKP_AUTH_HOSTNAME_PART}`;

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
