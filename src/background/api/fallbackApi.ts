import axios from 'axios';
import _ from 'lodash';
// @ts-expect-error - dns-js is not typed
import { DNSPacket, DNSRecord } from 'dns-js';

import pJSON from '../../../package.json';
import {
    AUTH_API_URL,
    TELEMETRY_API_URL,
    VPN_API_URL,
    STAGE_ENV,
    FORWARDER_DOMAIN,
} from '../config';
import { clearFromWrappingQuotes } from '../../common/utils/string';
import { log } from '../../common/logger';
import { fetchConfig } from '../../common/fetch-config';
import { getErrorMessage } from '../../common/utils/error';
import { stateStorage } from '../stateStorage';
import { authService } from '../authentication/authService';
import { credentialsService } from '../credentials/credentialsService';
import { type FallbackInfo, StorageKey } from '../schema';

/**
 * DNS over HTTPS (DoH) URLs.
 *
 * Actual list of DoH providers can be found in:
 * /projects/ADGUARD-CORE-LIBS/repos/vpn-client-backend-config/browse/backend.json
 */

const GOOGLE_DOH_HOSTNAME = 'dns.google';
export const GOOGLE_DOH_URL = `${GOOGLE_DOH_HOSTNAME}/dns-query`;

const DOHPUB_DOH_HOSTNAME = 'doh.pub';
export const DOHPUB_DOH_URL = `${DOHPUB_DOH_HOSTNAME}/dns-query`;

/**
 * We are using `dns11` because it supports secured ECS.
 *
 * @see {@link https://quad9.net/news/blog/doh-with-quad9-dns-servers/}
 */
const QUAD9_DOH_HOSTNAME = 'dns11.quad9.net';
export const QUAD9_DOH_URL = `${QUAD9_DOH_HOSTNAME}/dns-query`;

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
const APPLICATION_VERSION_PREFIX = 'av';

export class FallbackApi {
    /**
     * Default fallback info, it may be used if doh returns none result
     * We keep all fallback info in one object, because it's easier to work with
     * Also, vpnApiUrl and authApiUrl always are updated in pairs
     */
    defaultFallbackInfo: FallbackInfo;

    /**
     * Fallback info cache expiration time in milliseconds.
     */
    static DEFAULT_CACHE_EXPIRE_TIME_MS = 1000 * 60 * 5; // 5 minutes

    /**
     * Default urls we set already expired,
     * so we need to check bkp url immediately when bkp url is required
     */
    constructor(vpnApiUrl: string, authApiUrl: string, forwarderApiUrl: string) {
        this.defaultFallbackInfo = {
            vpnApiUrl,
            authApiUrl,
            forwarderApiUrl,
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

    /**
     * Updates the fallback info.
     * If backup urls are not received, the default fallback info is set.
     */
    private async updateFallbackInfo(): Promise<void> {
        const [bkpVpnApiUrl, bkpAuthApiUrl] = await Promise.all([
            this.getBkpVpnApiUrl(),
            this.getBkpAuthApiUrl(),
        ]);

        if (bkpVpnApiUrl && bkpAuthApiUrl) {
            this.fallbackInfo = {
                vpnApiUrl: bkpVpnApiUrl,
                authApiUrl: bkpAuthApiUrl,
                // use received vpn api url as forwarder api url
                forwarderApiUrl: bkpVpnApiUrl,
                expiresInMs: Date.now() + FallbackApi.DEFAULT_CACHE_EXPIRE_TIME_MS,
            };
        } else if (!this.fallbackInfo) {
            // set default fallback info if bkp urls are not received and fallback info is not set
            this.fallbackInfo = this.defaultFallbackInfo;
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

    /**
     * Returns fallback forwarder API URL. AG-32237.
     *
     * Received VPN API URL is used as a fallback forwarder API URL,
     * but if the default VPN API URL is received, the default forwarder API URL should be returned.
     *
     * @returns Forwarder API URL.
     */
    public getForwarderApiUrl = async (): Promise<string> => {
        const { forwarderApiUrl } = await this.getFallbackInfo();
        return forwarderApiUrl === this.defaultFallbackInfo.vpnApiUrl
            ? this.defaultFallbackInfo.forwarderApiUrl
            : forwarderApiUrl;
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
            TELEMETRY_API_URL,
            GOOGLE_DOH_HOSTNAME,
            DOHPUB_DOH_HOSTNAME,
            QUAD9_DOH_HOSTNAME,
        ].map((url) => `*${url}`);
    };

    /**
     * Queries the DNS server for a TXT record of the given name for backup API URL.
     *
     * @param dnsUrl DNS server URL to query, e.g. `dns.google/dns-query`.
     * @param name Name to query for, e.g. `bkp-api.adguard-vpn.online`.
     *
     * @returns Backup API URL from the TXT record.
     *
     * @throws Error if the DNS response is invalid or the backup URL is not found.
     */
    private async queryDns(dnsUrl: string, name: string): Promise<string> {
        // Create DNS query
        const packet = new DNSPacket();

        // Make query recursive
        packet.header.rd = 1;

        // We're using DoH so ID should be 0
        packet.header.id = 0;

        // Absolute fully qualified domain name should end with a dot,
        // to not allow DNS servers to append any suffixes.
        const absoluteFullyQualifiedDomainName = `${name}.`;

        // Add question for TXT record
        packet.question.push(
            new DNSRecord(
                absoluteFullyQualifiedDomainName,
                DNSRecord.Type.TXT, // TXT record type
                DNSRecord.Class.IN, // Internet class
            ),
        );

        // Send the DNS query over HTTPS (DoH)
        const { data } = await axios.post(`https://${dnsUrl}`, DNSPacket.toBuffer(packet), {
            headers: {
                'Content-Type': 'application/dns-message',
                Accept: 'application/dns-message',
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
            },
            timeout: REQUEST_TIMEOUT_MS,
            responseType: 'arraybuffer',
            ...fetchConfig,
        });

        // Parse the DNS response.
        const responseDataBuffer = Buffer.from(data);
        const responseData = DNSPacket.parse(responseDataBuffer);

        // Get the first answer from the response.
        const bkpUrl = _.get(responseData, 'answer[0].data[0]');

        if (typeof bkpUrl !== 'string' || !bkpUrl) {
            throw new Error(`Invalid bkp url from ${dnsUrl} doh for ${name}`);
        }

        return bkpUrl;
    }

    /**
     * Queries Google DNS over HTTPS (DoH) for a backup API URL.
     *
     * @param hostname Hostname to query for, e.g. `bkp-api.adguard-vpn.online`.
     *
     * @returns Backup API URL from Google DoH.
     *
     * @throws Error if the DNS response is invalid or the backup URL is not found.
     */
    private async getBkpUrlByGoogleDoh(hostname: string): Promise<string> {
        return this.queryDns(GOOGLE_DOH_URL, hostname);
    }

    /**
     * Queries AliDNS over HTTPS (DoH) for a backup API URL.
     *
     * @param hostname Hostname to query for, e.g. `bkp-api.adguard-vpn.online`.
     *
     * @returns Backup API URL from AliDNS DoH.
     *
     * @throws Error if the DNS response is invalid or the backup URL is not found.
     */
    private async getBkpUrlByDohPubDnsDoh(hostname: string): Promise<string> {
        return this.queryDns(DOHPUB_DOH_URL, hostname);
    }

    /**
     * Queries Quad9 DNS over HTTPS (DoH) for a backup API URL.
     *
     * @param hostname Hostname to query for, e.g. `bkp-api.adguard-vpn.online`.
     *
     * @returns Backup API URL from Quad9 DoH.
     *
     * @throws Error if the DNS response is invalid or the backup URL is not found.
     */
    private async getBkpUrlByQuad9Doh(hostname: string): Promise<string> {
        return this.queryDns(QUAD9_DOH_URL, hostname);
    }

    /**
     * Logs errors in the function and re-throws them to ensure that Promise.any receives them.
     *
     * @param fn Function to call.
     *
     * @throws Re-throws the error caught in the function.
     */
    private async debugErrors(fn: () => Promise<string>): Promise<string> {
        try {
            const res = await fn();
            return res;
        } catch (error) {
            // Usually it's either a network error or response is empty.
            // We don't want to spam logs with such errors,
            // that's why we only print them for debugging.
            log.debug(`Error in function ${fn.name}:`, getErrorMessage(error));

            // Re-throwing the error to ensure that Promise.any receives it
            throw error;
        }
    }

    /**
     * Fetches backup API URL by querying DNS over HTTPS (DoH) for the given hostname.
     * It tries to fetch the URL from multiple DoH providers (Google, AliDNS, Quad9)
     * and returns the first successful result or null if all attempts fail.
     *
     * @param hostname Hostname to query for, e.g. `bkp-api.adguard-vpn.online`.
     *
     * @returns Backup API URL if fetched successfully or null if fetching failed.
     */
    private async getBkpUrl(hostname: string): Promise<null | string> {
        let bkpUrl;

        try {
            bkpUrl = await Promise.any([
                this.debugErrors(() => this.getBkpUrlByGoogleDoh(hostname)),
                this.debugErrors(() => this.getBkpUrlByDohPubDnsDoh(hostname)),
                this.debugErrors(() => this.getBkpUrlByQuad9Doh(hostname)),
            ]);
            bkpUrl = clearFromWrappingQuotes(bkpUrl);
        } catch (e) {
            log.error(e);
            bkpUrl = null;
        }

        return bkpUrl;
    }

    /**
     * Returns base prefix for api hostname in format: `<whoami_version>.<application_type>.<application_version>`
     * where:
     * - `whoami_version` - version of whoami service {@link WHOAMI_VERSION}
     * - `application_type` - type of application {@link APPLICATION_TYPE}
     * - `application_version` - version of application (from package.json)
     *   in format `av-<major>-<minor>-<patch>`.
     *
     * For more details — AG-30618.
     *
     * @returns Prefix for api hostname.
     */
    private getBasePrefix = (): string => {
        const applicationVersion = `${APPLICATION_VERSION_PREFIX}${pJSON.version.replaceAll('.', '-')}`;
        return `${WHOAMI_VERSION}.${APPLICATION_TYPE}.${applicationVersion}`;
    };

    getApiHostnamePrefix = async () => {
        const basePrefix = this.getBasePrefix();

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

    /**
     * Fetches and returns backup VPN API URL.
     *
     * @returns Backup VPN API URL if fetched successfully and not an empty string;
     * if fetched url is an empty string, returns default fallback VPN API URL;
     * OR null if fetching failed.
     */
    getBkpVpnApiUrl = async (): Promise<string | null> => {
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
}

export const fallbackApi = new FallbackApi(VPN_API_URL, AUTH_API_URL, FORWARDER_DOMAIN);
