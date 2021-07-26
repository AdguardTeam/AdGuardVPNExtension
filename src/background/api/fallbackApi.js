import axios from 'axios';
import { log } from '../../lib/logger';
import { clearFromWrappingQuotes } from '../../lib/helpers';
import { AUTH_API_URL, VPN_API_URL, STAGE_ENV } from '../config';
import { apiUrlCache } from './apiUrlCache';

// DNS over https api
export const GOOGLE_DOH_URL = 'dns.google/resolve';
export const CLOUDFLARE_DOH_URL = 'cloudflare-dns.com/dns-query';
export const ALIDNS_DOH_URL = 'dns.alidns.com/resolve';

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
    constructor(vpnApiUrl, authApiUrl) {
        this.setVpnApiUrl(vpnApiUrl);
        this.setAuthApiUrl(authApiUrl);
    }

    setVpnApiUrl = (url) => {
        this.vpnApiUrl = url;
        apiUrlCache.set(VPN_API_URL_KEY, this.vpnApiUrl);
    }

    setAuthApiUrl = (url) => {
        this.authApiUrl = url;
        apiUrlCache.set(AUTH_API_URL_KEY, this.authApiUrl);
    }

    getVpnApiUrl = async () => {
        if (apiUrlCache.isNeedUpdate(VPN_API_URL_KEY)) {
            await this.updateVpnApiUrl();
            return this.vpnApiUrl;
        }

        return this.vpnApiUrl;
    }

    getAuthApiUrl = async () => {
        if (apiUrlCache.isNeedUpdate(AUTH_API_URL_KEY)) {
            await this.updateAuthApiUrl();
            return this.authApiUrl;
        }

        return this.authApiUrl;
    }

    getAuthBaseUrl = async () => {
        const authApiUrl = await this.getAuthApiUrl();
        return `${authApiUrl}/oauth/authorize`;
    }

    getAuthRedirectUri = async () => {
        const authApiUrl = await this.getAuthApiUrl();
        return `${authApiUrl}/oauth.html?adguard-vpn=1`;
    }

    getAccountApiUrl = async () => {
        const vpnApiUrl = await this.getVpnApiUrl();
        return `${vpnApiUrl}/account`;
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

    async updateVpnApiUrl() {
        const { country } = await this.getCountryInfo();
        const bkpUrl = await this.getBkpVpnApiUrl(country);
        if (bkpUrl) {
            this.setVpnApiUrl(bkpUrl);
        }
    }

    async updateAuthApiUrl() {
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
    getLocalStorageBkp = () => {
        let localStorageBkp = Number.parseInt(localStorage.getItem(BKP_KEY), 10);

        localStorageBkp = Number.isNaN(localStorageBkp) ? 0 : localStorageBkp;

        return !!localStorageBkp;
    }

    getCountryInfo = async () => {
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

    getBkpUrlByGoogleDoh = async (name) => {
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

        return bkpUrl;
    };

    getBkpUrlByCloudFlareDoh = async (name) => {
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

        return bkpUrl;
    };

    getBkpUrlByAliDnsDoh = async (name) => {
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

        return bkpUrl;
    };

    getBkpUrl = async (hostname) => {
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

    getBkpVpnApiUrl = async (country) => {
        const hostname = `${country.toLowerCase()}.${BKP_API_HOSTNAME_PART}`;
        const bkpApiUrl = await this.getBkpUrl(hostname);
        return bkpApiUrl;
    };

    getBkpAuthApiUrl = async (country) => {
        const hostname = `${country.toLowerCase()}.${BKP_AUTH_HOSTNAME_PART}`;
        const bkpAuthUrl = await this.getBkpUrl(hostname);
        return bkpAuthUrl;
    };

    getApiUrlsExclusions = async () => {
        return [
            await this.getVpnApiUrl(),
            await this.getAuthApiUrl(),
        ].map((url) => `*${url}`);
    };
}

export const fallbackApi = new FallbackApi(VPN_API_URL, AUTH_API_URL);
