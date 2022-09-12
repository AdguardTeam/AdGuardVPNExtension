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
        ip1: string;
        ip2: string;
    }
}

export const DNS_SERVERS: DnsServers = {
    [DNS_DEFAULT]: {
        title: translator.getMessage('settings_dns_selector_default_title'),
        desc: translator.getMessage('settings_dns_selector_default_desc'),
        ip1: '',
        ip2: '',
    },
    'adguard-dns': {
        title: translator.getMessage('settings_dns_selector_adguard_title'),
        desc: translator.getMessage('settings_dns_selector_adguard_desc'),
        ip1: '94.140.14.14',
        ip2: '94.140.15.15',
    },
    'adguard-dns-non-filtering': {
        title: translator.getMessage('settings_dns_selector_adguard_nonfiltering_title'),
        desc: translator.getMessage('settings_dns_selector_adguard_nonfiltering_desc'),
        ip1: '94.140.14.140',
        ip2: '94.140.14.141',
    },
    'adguard-dns-family': {
        title: translator.getMessage('settings_dns_selector_adguard_family_title'),
        desc: translator.getMessage('settings_dns_selector_adguard_family_desc'),
        ip1: '94.140.14.15',
        ip2: '94.140.15.16',
    },
    'google-dns': {
        title: translator.getMessage('settings_dns_selector_google_title'),
        desc: translator.getMessage('settings_dns_selector_google_desc'),
        ip1: '8.8.8.8',
        ip2: '8.8.4.4',
    },
    'cloudflare-dns': {
        title: translator.getMessage('settings_dns_selector_cloudflare_title'),
        desc: translator.getMessage('settings_dns_selector_cloudflare_desc'),
        ip1: '1.1.1.1',
        ip2: '1.0.0.1',
    },
    'cisco-dns': {
        title: translator.getMessage('settings_dns_selector_cisco_title'),
        desc: translator.getMessage('settings_dns_selector_cisco_desc'),
        ip1: '208.67.222.222',
        ip2: '208.67.220.220',
    },
    'quad9-dns': {
        title: translator.getMessage('settings_dns_selector_quad9_title'),
        desc: translator.getMessage('settings_dns_selector_quad9_desc'),
        ip1: '9.9.9.9',
        ip2: '149.112.112.112',
    },
};

export const DNS_SETTINGS_QUERY = 'dns_settings';
