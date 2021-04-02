import axios from 'axios';
import { log } from '../../lib/logger';
import { clearFromWrappingQuotes, getFirstResolved } from '../../lib/helpers';
import { AUTH_API_URL, VPN_API_URL } from '../config';

export const WHOAMI_URL = 'https://whoami.adguard-vpn.online';
export const GOOGLE_DOH_URL = 'https://dns.google/resolve';
export const CLOUDFLARE_DOH_URL = 'https://cloudflare-dns.com/dns-query';
const BKP_API_HOSTNAME_PART = '.bkp-api.adguard-vpn.online';
const BKP_AUTH_HOSTNAME_PART = '.bkp-auth.adguard-vpn.online';

const DEFAULT_COUNTRY_INFO = { country: 'none', bkp: true };

const REQUEST_TIMEOUT_MS = 3 * 1000;

export class FallbackApi {
    constructor(vpnApiUrl, authApiUrl) {
        this.vpnApiUrl = vpnApiUrl;
        this.authApiUrl = authApiUrl;
    }

    getVpnApiUrl = () => {
        return this.vpnApiUrl;
    }

    getAuthApiUrl = () => {
        return this.authApiUrl;
    }

    async init() {
        const countryInfo = await this.getCountryInfo();
        if (!countryInfo.bkp) {
            return;
        }

        const [bkpVpnApiUrl, bkpAuthApiUrl] = await Promise.all([
            this.getBkpVpnApiUrl(countryInfo.country),
            this.getBkpAuthApiUrl(countryInfo.country),
        ]);

        if (bkpVpnApiUrl) {
            this.vpnApiUrl = bkpVpnApiUrl;
        }

        if (bkpAuthApiUrl) {
            this.authApiUrl = bkpAuthApiUrl;
        }
    }

    getCountryInfo = async () => {
        try {
            const { data: { country, bkp } } = await axios.get(
                WHOAMI_URL,
                { timeout: REQUEST_TIMEOUT_MS },
            );
            return { country, bkp };
        } catch (e) {
            log.error(e);
            return DEFAULT_COUNTRY_INFO;
        }
    };

    getBkpUrlByGoogleDoh = async (name) => {
        const { data } = await axios.get(GOOGLE_DOH_URL, {
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
        const { data } = await axios.get(CLOUDFLARE_DOH_URL, {
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
        const requesters = [
            this.getBkpUrlByGoogleDoh.bind(null, hostname),
            this.getBkpUrlByCloudFlareDoh.bind(null, hostname),
        ];

        let bkpUrl;

        try {
            bkpUrl = await getFirstResolved(requesters, log.error);
            bkpUrl = clearFromWrappingQuotes(bkpUrl);
        } catch (e) {
            log.error(e);
            bkpUrl = null;
        }

        return bkpUrl;
    };

    getBkpVpnApiUrl = async (country) => {
        const hostname = `${country}${BKP_API_HOSTNAME_PART}`;
        const bkpApiUrl = await this.getBkpUrl(hostname);
        return bkpApiUrl;
    };

    getBkpAuthApiUrl = async (country) => {
        const hostname = `${country}${BKP_AUTH_HOSTNAME_PART}`;
        const bkpAuthUrl = await this.getBkpUrl(hostname);
        return bkpAuthUrl;
    };
}

export const fallbackApi = new FallbackApi(VPN_API_URL, AUTH_API_URL);
