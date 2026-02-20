import { type DnsServerData } from '../background/schema';

import { translator } from './translator';

/**
 * Default DNS server data.
 *
 * `title` and `desc` are JS getter properties so that every read calls
 * `translator.getMessage()`, which in turn reads the MobX-observable locale
 * from `TranslationStore`. This means any `observer` component or `@computed`
 * that accesses these fields automatically re-renders / re-evaluates when the
 * user switches language, instead of capturing a stale string at module load time.
 *
 * The `translator.getMessage('key')` call form is intentional: it keeps the
 * message keys searchable by the same patterns used everywhere else in the codebase.
 */
export const DEFAULT_DNS_SERVER = {
    id: 'default',
    address: '',
    get title(): string { return translator.getMessage('settings_dns_selector_default_title'); },
    get desc(): string { return translator.getMessage('settings_dns_selector_default_desc'); },
} satisfies DnsServerData;

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
 *
 * See {@link DEFAULT_DNS_SERVER} for why `title` and `desc` are getter properties.
 */
export const POPULAR_DNS_SERVERS = [
    {
        id: ADGUARD_DNS_ID,
        address: '94.140.14.14',
        get title(): string { return translator.getMessage('settings_dns_selector_adguard_title'); },
        get desc(): string { return translator.getMessage('settings_dns_selector_adguard_desc'); },
    },
    {
        id: ADGUARD_NON_FILTERING_DNS_ID,
        address: '94.140.14.140',
        get title(): string { return translator.getMessage('settings_dns_selector_adguard_nonfiltering_title'); },
        get desc(): string { return translator.getMessage('settings_dns_selector_adguard_nonfiltering_desc'); },
    },
    {
        id: ADGUARD_FAMILY_DNS_ID,
        address: '94.140.14.15',
        get title(): string { return translator.getMessage('settings_dns_selector_adguard_family_title'); },
        get desc(): string { return translator.getMessage('settings_dns_selector_adguard_family_desc'); },
    },
    {
        id: GOOGLE_DNS_ID,
        address: '8.8.8.8',
        get title(): string { return translator.getMessage('settings_dns_selector_google_title'); },
        get desc(): string { return translator.getMessage('settings_dns_selector_google_desc'); },
    },
    {
        id: CLOUDFLARE_DNS_ID,
        address: '1.1.1.1',
        get title(): string { return translator.getMessage('settings_dns_selector_cloudflare_title'); },
        get desc(): string { return translator.getMessage('settings_dns_selector_cloudflare_desc'); },
    },
    {
        id: CISCO_DNS_ID,
        address: '208.67.222.222',
        get title(): string { return translator.getMessage('settings_dns_selector_cisco_title'); },
        get desc(): string { return translator.getMessage('settings_dns_selector_cisco_desc'); },
    },
    {
        id: QUAD9_DNS_ID,
        address: '9.9.9.9',
        get title(): string { return translator.getMessage('settings_dns_selector_quad9_title'); },
        get desc(): string { return translator.getMessage('settings_dns_selector_quad9_desc'); },
    },
] satisfies DnsServerData[];
