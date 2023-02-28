import axios from 'axios';
import { browserApi } from '../browserApi';

import {
    AUTH_API_URL,
    VPN_API_URL,
    STAGE_ENV,
    WHOAMI_URL,
    AUTH_ACCESS_TOKEN_KEY,
} from '../config';
import { clearFromWrappingQuotes } from '../../lib/string-utils';
import { log } from '../../lib/logger';
import { fetchConfig, VPN_TOKEN_KEY } from '../../lib/constants';
import type { AuthAccessToken } from './apiTypes';
import type { VpnTokenData } from '../credentials/Credentials';

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

const NOT_AUTHENTICATED_USER_PREFIX = 'anon';
const FREE_USER_PREFIX = 'free';
const PREMIUM_USER_PREFIX = 'pro';

type CountryInfo = {
    country: string;
    bkp: boolean;
};

type FallbackInfo = {
    vpnApiUrl: string;
    authApiUrl: string;
    countryInfo: CountryInfo;
    expiresInMs: number;
};

export class FallbackApi {
    /**
     * We keep all fallback info in one object, because it's easier to work with
     * Also, vpnApiUrl and authApiUrl always are updated in pairs
     */
    fallbackInfo: FallbackInfo;

    /**
     * Here we save default apn api url, it may be used if doh returns none result
     */
    defaultVpnApiUrl: string;

    /**
     * Here we save default auth api url, it may be used if doh returns none result
     */
    defaultAuthApiUrl: string;

    /**
     * Default urls we set already expired,
     * so we need to check bkp url immediately when bkp url is required
     */
    constructor(vpnApiUrl: string, authApiUrl: string) {
        this.defaultVpnApiUrl = vpnApiUrl;
        this.defaultAuthApiUrl = authApiUrl;

        this.setFallbackInfo({
            vpnApiUrl,
            authApiUrl,
            countryInfo: DEFAULT_COUNTRY_INFO,
            expiresInMs: Date.now() - 1,
        });
    }

    public async init(): Promise<void> {
        await this.updateFallbackInfo();
    }

    private setFallbackInfo(fallbackInfo: FallbackInfo) {
        this.fallbackInfo = fallbackInfo;
    }

    private static needsUpdate(fallbackInfo: FallbackInfo): boolean {
        return fallbackInfo.expiresInMs < Date.now();
    }

    private async updateFallbackInfo() {
        const countryInfo = await this.getCountryInfo();
        const localStorageBkp = await this.getLocalStorageBkp();

        if (!countryInfo.bkp && !localStorageBkp) {
            // if bkp is disabled, we use previous fallback info, only update expiration time
            this.setFallbackInfo({
                ...this.fallbackInfo,
                expiresInMs: Date.now() + DEFAULT_CACHE_EXPIRE_TIME_MS,
            });
            return;
        }

        const [bkpVpnApiUrl, bkpAuthApiUrl] = await Promise.all([
            this.getBkpVpnApiUrl(countryInfo.country),
            this.getBkpAuthApiUrl(countryInfo.country),
        ]);

        if (bkpVpnApiUrl && bkpAuthApiUrl) {
            this.setFallbackInfo({
                vpnApiUrl: bkpVpnApiUrl,
                authApiUrl: bkpAuthApiUrl,
                countryInfo,
                expiresInMs: Date.now() + DEFAULT_CACHE_EXPIRE_TIME_MS,
            });
        }
    }

    private async getFallbackInfo(): Promise<FallbackInfo> {
        if (FallbackApi.needsUpdate(this.fallbackInfo)) {
            await this.updateFallbackInfo();
        }

        return this.fallbackInfo;
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

    private getCountryInfo = async (): Promise<CountryInfo> => {
        try {
            const { data: { country, bkp } } = await axios.get(
                `https://${WHOAMI_URL}`,
                {
                    timeout: REQUEST_TIMEOUT_MS,
                    ...fetchConfig,
                },
            );
            return { country, bkp };
        } catch (e) {
            log.error(e);
            return DEFAULT_COUNTRY_INFO;
        }
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

        const { Answer: [{ data: bkpUrl }] } = data;

        if (!FallbackApi.isString(bkpUrl)) {
            throw new Error('Invalid bkp url from google doh');
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

        const { Answer: [{ data: bkpUrl }] } = data;

        if (!FallbackApi.isString(bkpUrl)) {
            throw new Error('Invalid bkp url from cloudflare doh');
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
        const accessTokenData: AuthAccessToken = await browserApi.storage.get(AUTH_ACCESS_TOKEN_KEY);
        if (!accessTokenData || !accessTokenData.accessToken) {
            return NOT_AUTHENTICATED_USER_PREFIX;
        }

        const vpnToken: VpnTokenData = await browserApi.storage.get(VPN_TOKEN_KEY);
        if (vpnToken?.licenseKey) {
            return PREMIUM_USER_PREFIX;
        }

        return FREE_USER_PREFIX;
    };

    getBkpVpnApiUrl = async (country: string) => {
        const prefix = await this.getApiHostnamePrefix();
        // we use prefix for api hostname to recognize free, premium and not authenticated users
        const hostname = `${country.toLowerCase()}.${prefix}.${BKP_API_HOSTNAME_PART}`;
        const bkpApiUrl = await this.getBkpUrl(hostname);
        if (bkpApiUrl === EMPTY_BKP_URL) {
            return this.defaultVpnApiUrl;
        }
        return bkpApiUrl;
    };

    getBkpAuthApiUrl = async (country: string) => {
        const hostname = `${country.toLowerCase()}.${BKP_AUTH_HOSTNAME_PART}`;

        const bkpAuthUrl = await this.getBkpUrl(hostname);
        if (bkpAuthUrl === EMPTY_BKP_URL) {
            return this.defaultAuthApiUrl;
        }

        return bkpAuthUrl;
    };

    private static isString(val: unknown): boolean {
        return typeof val === 'string';
    }
}

export const fallbackApi = new FallbackApi(VPN_API_URL, AUTH_API_URL);
