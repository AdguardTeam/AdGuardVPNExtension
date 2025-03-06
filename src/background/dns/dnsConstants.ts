import type { DnsServerData } from '../schema';
/**
 * IMPORTANT
 * Do not import inside this file other dependencies,
 * because imports of this file are also used in the popup
 * and redundant code from background may get into popup code
 */
import { translator } from '../../common/translator';
// FIXME: This import causes issue.
import { TelemetryActionName } from '../telemetry';

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
 * Popular DNS servers data.
 */
export const POPULAR_DNS_SERVERS: DnsServerData[] = [
    {
        id: 'adguard-dns',
        title: translator.getMessage('settings_dns_selector_adguard_title'),
        desc: translator.getMessage('settings_dns_selector_adguard_desc'),
        address: '94.140.14.14',
        telemetryActionName: TelemetryActionName.AdguardDnsClick,
    },
    {
        id: 'adguard-dns-non-filtering',
        title: translator.getMessage('settings_dns_selector_adguard_nonfiltering_title'),
        desc: translator.getMessage('settings_dns_selector_adguard_nonfiltering_desc'),
        address: '94.140.14.140',
        telemetryActionName: TelemetryActionName.AdguardNonfilteringDnsClick,
    },
    {
        id: 'adguard-dns-family',
        title: translator.getMessage('settings_dns_selector_adguard_family_title'),
        desc: translator.getMessage('settings_dns_selector_adguard_family_desc'),
        address: '94.140.14.15',
        telemetryActionName: TelemetryActionName.AdguardFamilyDnsClick,
    },
    {
        id: 'google-dns',
        title: translator.getMessage('settings_dns_selector_google_title'),
        desc: translator.getMessage('settings_dns_selector_google_desc'),
        address: '8.8.8.8',
        telemetryActionName: TelemetryActionName.GoogleDnsClick,
    },
    {
        id: 'cloudflare-dns',
        title: translator.getMessage('settings_dns_selector_cloudflare_title'),
        desc: translator.getMessage('settings_dns_selector_cloudflare_desc'),
        address: '1.1.1.1',
        telemetryActionName: TelemetryActionName.CloudflareDnsClick,
    },
    {
        id: 'cisco-dns',
        title: translator.getMessage('settings_dns_selector_cisco_title'),
        desc: translator.getMessage('settings_dns_selector_cisco_desc'),
        address: '208.67.222.222',
        telemetryActionName: TelemetryActionName.CiscoDnsClick,
    },
    {
        id: 'quad9-dns',
        title: translator.getMessage('settings_dns_selector_quad9_title'),
        desc: translator.getMessage('settings_dns_selector_quad9_desc'),
        address: '9.9.9.9',
        telemetryActionName: TelemetryActionName.QuadDnsClick,
    },
];
