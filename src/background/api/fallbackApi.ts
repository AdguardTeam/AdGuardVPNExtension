import axios from 'axios';
import { log } from '../../lib/logger';
import { clearFromWrappingQuotes } from '../../lib/helpers';
import { AUTH_API_URL, VPN_API_URL, STAGE_ENV } from '../config';
import { apiUrlCache } from './apiUrlCache';

// DNS over https api
const GOOGLE_DOH_HOSTNAME = 'dns.google';
export const GOOGLE_DOH_URL = `${GOOGLE_DOH_HOSTNAME}/resolve`;

const CLOUDFLARE_DOH_HOSTNAME = 'cloudflare-dns.com';
export const CLOUDFLARE_DOH_URL = `${CLOUDFLARE_DOH_HOSTNAME}/dns-query`;

const ALIDNS_DOH_HOSTNAME = 'dns.alidns.com';
export const ALIDNS_DOH_URL = `${ALIDNS_DOH_HOSTNAME}/resolve`;

const stageSuffix = STAGE_ENV === 'test' ? '-dev' : '';
export const WHOAMI_URL = `whoami${stageSuffix}.adguard-vpn.online`;
const BKP_API_HOSTNAME_PART = `bkp-api${stageSuffix}.adguard-vpn.online`;
const BKP_AUTH_HOSTNAME_PART = `bkp-auth${stageSuffix}.adguard-vpn.online`;

const BKP_KEY = 'bkp';

const EMPTY_BKP_URL = 'none';

const DEFAULT_COUNTRY_INFO = { country: 'none', bkp: true };

const REQUEST_TIMEOUT_MS = 3 * 1000;

export const VPN_API_URL_KEY = 'vpn';
export const AUTH_API_URL_KEY = 'auth';

export class FallbackApi {
    vpnApiUrl: string;

    authApiUrl: string;

    /**
     * Default urls we set already expired,
     * so we need to check bkp url immediately when bkp url is required
     */
    constructor(vpnApiUrl: string, authApiUrl: string) {
        this.setVpnApiUrl(vpnApiUrl, Date.now());
        this.setAuthApiUrl(authApiUrl, Date.now());
    }

    async init() {
        const countryInfo = await this.getCountryInfo();
        const localStorageBkp = this.getLocalStorageBkp();

        if (!countryInfo.bkp && !localStorageBkp) {
            return;
        }

        const [bkpVpnApiUrl, bkpAuthApiUrl] = await Promise.all([
            this.getBkpVpnApiUrl(countryInfo.country),
            this.getBkpAuthApiUrl(countryInfo.country),
        ]);

        if (bkpVpnApiUrl) {
            this.setVpnApiUrl(bkpVpnApiUrl);
        }

        if (bkpAuthApiUrl) {
            this.setAuthApiUrl(bkpAuthApiUrl);
        }
    }

    public getVpnApiUrl = async () => {
        if (apiUrlCache.needsUpdate(VPN_API_URL_KEY)) {
            await this.updateVpnApiUrl();
            return this.vpnApiUrl;
        }

        return this.vpnApiUrl;
    };

    public getAuthApiUrl = async () => {
        if (apiUrlCache.needsUpdate(AUTH_API_URL_KEY)) {
            await this.updateAuthApiUrl();
            return this.authApiUrl;
        }

        return this.authApiUrl;
    };

    public getAuthBaseUrl = async () => {
        const authApiUrl = await this.getAuthApiUrl();
        return `${authApiUrl}/oauth/authorize`;
    };

    public getAuthRedirectUri = async () => {
        const authApiUrl = await this.getAuthApiUrl();
        return `${authApiUrl}/oauth.html?adguard-vpn=1`;
    };

    public getAccountApiUrl = async () => {
        const vpnApiUrl = await this.getVpnApiUrl();
        return `${vpnApiUrl}/account`;
    };

    public getApiUrlsExclusions = async () => {
        return [
            await this.getVpnApiUrl(),
            await this.getAuthApiUrl(),
            GOOGLE_DOH_HOSTNAME,
            CLOUDFLARE_DOH_HOSTNAME,
            ALIDNS_DOH_HOSTNAME,
            WHOAMI_URL,
        ].map((url) => `*${url}`);
    };

    private setVpnApiUrl = (url: string, expireInMs?: number) => {
        this.vpnApiUrl = url;
        apiUrlCache.set(VPN_API_URL_KEY, this.vpnApiUrl, expireInMs);
    };

    private setAuthApiUrl = (url: string, expiresInMs?: number) => {
        this.authApiUrl = url;
        apiUrlCache.set(AUTH_API_URL_KEY, this.authApiUrl, expiresInMs);
    };

    private async updateVpnApiUrl() {
        const { country } = await this.getCountryInfo();
        const bkpUrl = await this.getBkpVpnApiUrl(country);
        if (bkpUrl) {
            this.setVpnApiUrl(bkpUrl);
        }
    }

    private async updateAuthApiUrl() {
        const { country } = await this.getCountryInfo();
        const bkpUrl = await this.getBkpAuthApiUrl(country);
        if (bkpUrl) {
            this.setAuthApiUrl(bkpUrl);
        }
    }

    /**
     * Gets bkp flag value from local storage, used for testing purposes
     * @return {boolean}
     */
    private getLocalStorageBkp = () => {
        const storedBkp = localStorage.getItem(BKP_KEY);
        let localStorageBkp = Number.parseInt(String(storedBkp), 10);

        localStorageBkp = Number.isNaN(localStorageBkp) ? 0 : localStorageBkp;

        return !!localStorageBkp;
    };

    private getCountryInfo = async () => {
        try {
            const { data: { country, bkp } } = await axios.get(
                `https://${WHOAMI_URL}`,
                { timeout: REQUEST_TIMEOUT_MS },
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
            if (bkpUrl === EMPTY_BKP_URL) {
                bkpUrl = null;
            }
        } catch (e) {
            log.error(e);
            bkpUrl = null;
        }

        return bkpUrl;
    };

    private getBkpVpnApiUrl = async (country: string) => {
        const hostname = `${country.toLowerCase()}.${BKP_API_HOSTNAME_PART}`;
        const bkpApiUrl = await this.getBkpUrl(hostname);
        return bkpApiUrl;
    };

    private getBkpAuthApiUrl = async (country: string) => {
        const hostname = `${country.toLowerCase()}.${BKP_AUTH_HOSTNAME_PART}`;
        const bkpAuthUrl = await this.getBkpUrl(hostname);
        return bkpAuthUrl;
    };

    private static isString(val: unknown): boolean {
        return typeof val === 'string';
    }
}

export const fallbackApi = new FallbackApi(VPN_API_URL, AUTH_API_URL);
