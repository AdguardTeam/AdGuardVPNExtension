/**
 * IMPORTANT
 * Do not import inside this file other dependencies,
 * because imports of this file are also used in the popup
 * and redundant code from background may get into popup code
 */
import { translator } from '../../common/translator';

export const DNS_DEFAULT = 'default';

interface DnsServers {
    [key: string]: {
        title: string;
        desc: string;
        address: string;
    }
}

export const DNS_SERVERS: DnsServers = {
    [DNS_DEFAULT]: {
        title: translator.getMessage('settings_dns_selector_default_title'),
        desc: translator.getMessage('settings_dns_selector_default_desc'),
        address: '',
    },
    'adguard-dns': {
        title: translator.getMessage('settings_dns_selector_adguard_title'),
        desc: translator.getMessage('settings_dns_selector_adguard_desc'),
        address: '94.140.14.14',
    },
    'adguard-dns-non-filtering': {
        title: translator.getMessage('settings_dns_selector_adguard_nonfiltering_title'),
        desc: translator.getMessage('settings_dns_selector_adguard_nonfiltering_desc'),
        address: '94.140.14.140',
    },
    'adguard-dns-family': {
        title: translator.getMessage('settings_dns_selector_adguard_family_title'),
        desc: translator.getMessage('settings_dns_selector_adguard_family_desc'),
        address: '94.140.14.15',
    },
    'google-dns': {
        title: translator.getMessage('settings_dns_selector_google_title'),
        desc: translator.getMessage('settings_dns_selector_google_desc'),
        address: '8.8.8.8',
    },
    'cloudflare-dns': {
        title: translator.getMessage('settings_dns_selector_cloudflare_title'),
        desc: translator.getMessage('settings_dns_selector_cloudflare_desc'),
        address: '1.1.1.1',
    },
    'cisco-dns': {
        title: translator.getMessage('settings_dns_selector_cisco_title'),
        desc: translator.getMessage('settings_dns_selector_cisco_desc'),
        address: '208.67.222.222',
    },
    'quad9-dns': {
        title: translator.getMessage('settings_dns_selector_quad9_title'),
        desc: translator.getMessage('settings_dns_selector_quad9_desc'),
        address: '9.9.9.9',
    },
};
