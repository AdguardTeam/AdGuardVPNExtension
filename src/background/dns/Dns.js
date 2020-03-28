// eslint-disable-next-line import/no-cycle
import connectivity from '../connectivity';
import translator from '../../lib/translator';

export const DNS_DEFAULT = 'default';

export const dnsData = {
    [DNS_DEFAULT]: {
        title: translator.translate('settings_dns_selector_default_title'),
        desc: translator.translate('settings_dns_selector_default_desc'),
        ip1: '',
        ip2: '',
    },
    'adguard-dns': {
        title: translator.translate('settings_dns_selector_adguard_title'),
        desc: translator.translate('settings_dns_selector_adguard_desc'),
        ip1: '176.103.130.130',
        ip2: '176.103.130.131',
    },
    'adguard-dns-family': {
        title: translator.translate('settings_dns_selector_adguard_family_title'),
        desc: translator.translate('settings_dns_selector_adguard_family_desc'),
        ip1: '176.103.130.132',
        ip2: '176.103.130.134',
    },
    'google-dns': {
        title: translator.translate('settings_dns_selector_google_title'),
        desc: translator.translate('settings_dns_selector_google_desc'),
        ip1: '8.8.8.8',
        ip2: '8.8.4.4',
    },
    'cloudflare-dns': {
        title: translator.translate('settings_dns_selector_cloudflare_title'),
        desc: translator.translate('settings_dns_selector_cloudflare_desc'),
        ip1: '1.1.1.1',
        ip2: '1.0.0.1',
    },
    'cisco-dns': {
        title: translator.translate('settings_dns_selector_cisco_title'),
        desc: translator.translate('settings_dns_selector_cisco_desc'),
        ip1: '208.67.222.222',
        ip2: '208.67.220.220',
    },
    'quad9-dns': {
        title: translator.translate('settings_dns_selector_quad9_title'),
        desc: translator.translate('settings_dns_selector_quad9_desc'),
        ip1: '9.9.9.9',
        ip2: '149.112.112.112',
    },
};

class Dns {
    constructor() {
        this.dnsServer = DNS_DEFAULT;
    }

    getDnsIp = () => dnsData[this.dnsServer].ip1;

    sendDnsSettings = (dnsServer) => {
        if (dnsServer) {
            this.dnsServer = dnsServer;
        }
        connectivity.endpointConnectivity.sendDnsSettings(this.getDnsIp());
    };
}

const dns = new Dns();

export default dns;
