import translator from '../../lib/translator';

const dnsList = [{
    id: 'default',
    title: translator.translate('settings_dns_selector_default_title'),
    desc: translator.translate('settings_dns_selector_default_desc'),
    ip1: '0.0.0.0',
    ip2: '0.0.0.0',
}, {
    id: 'adguard-dns',
    title: translator.translate('settings_dns_selector_adguard_title'),
    desc: translator.translate('settings_dns_selector_adguard_desc'),
    ip1: '176.103.130.130',
    ip2: '176.103.130.131',
}, {
    id: 'google-dns',
    title: translator.translate('settings_dns_selector_google_title'),
    desc: translator.translate('settings_dns_selector_google_desc'),
    ip1: '8.8.8.8',
    ip2: '8.8.4.4',
}, {
    id: 'cloudflare-dns',
    title: translator.translate('settings_dns_selector_cloudflare_title'),
    desc: translator.translate('settings_dns_selector_cloudflare_desc'),
    ip1: '1.1.1.1',
    ip2: '1.0.0.1',
}, {
    id: 'cisco-dns',
    title: translator.translate('settings_dns_selector_cisco_title'),
    desc: translator.translate('settings_dns_selector_cisco_desc'),
    ip1: '208.67.222.222',
    ip2: '208.67.220.220',
}, {
    id: 'quad9-dns',
    title: translator.translate('settings_dns_selector_quad9_title'),
    desc: translator.translate('settings_dns_selector_quad9_desc'),
    ip1: '9.9.9.9',
    ip2: '149.112.112.112',
}];

export default dnsList;
