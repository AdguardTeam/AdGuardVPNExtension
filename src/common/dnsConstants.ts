import { type DnsServerData } from '../background/schema';

import { translator } from './translator';

/**
 * Default DNS server data.
 */
export const DEFAULT_DNS_SERVER: DnsServerData = {
    id: 'default',
    title: translator.getMessage('settings_dns_selector_default_title'),
    desc: translator.getMessage('settings_dns_selector_default_desc'),
    address: '',
};

/**
 * AdGuard DNS server ID.
 */
export const ADGUARD_DNS_ID = 'adguard-dns';

/**
 * AdGuard Non-filtering DNS server ID.
 */
export const ADGUARD_NON_FILTERING_DNS_ID = 'adguard-dns-non-filtering';

/**
 * AdGuard Family DNS server ID.
 */
export const ADGUARD_FAMILY_DNS_ID = 'adguard-dns-family';

/**
 * Google DNS server ID.
 */
export const GOOGLE_DNS_ID = 'google-dns';

/**
 * Cloudflare DNS server ID.
 */
export const CLOUDFLARE_DNS_ID = 'cloudflare-dns';

/**
 * Cisco DNS server ID.
 */
export const CISCO_DNS_ID = 'cisco-dns';

/**
 * Quad9 DNS server ID.
 */
export const QUAD9_DNS_ID = 'quad9-dns';

/**
 * Popular DNS servers data.
 */
export const POPULAR_DNS_SERVERS: DnsServerData[] = [
    {
        id: ADGUARD_DNS_ID,
        title: translator.getMessage('settings_dns_selector_adguard_title'),
        desc: translator.getMessage('settings_dns_selector_adguard_desc'),
        address: '94.140.14.14',
    },
    {
        id: ADGUARD_NON_FILTERING_DNS_ID,
        title: translator.getMessage('settings_dns_selector_adguard_nonfiltering_title'),
        desc: translator.getMessage('settings_dns_selector_adguard_nonfiltering_desc'),
        address: '94.140.14.140',
    },
    {
        id: ADGUARD_FAMILY_DNS_ID,
        title: translator.getMessage('settings_dns_selector_adguard_family_title'),
        desc: translator.getMessage('settings_dns_selector_adguard_family_desc'),
        address: '94.140.14.15',
    },
    {
        id: GOOGLE_DNS_ID,
        title: translator.getMessage('settings_dns_selector_google_title'),
        desc: translator.getMessage('settings_dns_selector_google_desc'),
        address: '8.8.8.8',
    },
    {
        id: CLOUDFLARE_DNS_ID,
        title: translator.getMessage('settings_dns_selector_cloudflare_title'),
        desc: translator.getMessage('settings_dns_selector_cloudflare_desc'),
        address: '1.1.1.1',
    },
    {
        id: CISCO_DNS_ID,
        title: translator.getMessage('settings_dns_selector_cisco_title'),
        desc: translator.getMessage('settings_dns_selector_cisco_desc'),
        address: '208.67.222.222',
    },
    {
        id: QUAD9_DNS_ID,
        title: translator.getMessage('settings_dns_selector_quad9_title'),
        desc: translator.getMessage('settings_dns_selector_quad9_desc'),
        address: '9.9.9.9',
    },
];
