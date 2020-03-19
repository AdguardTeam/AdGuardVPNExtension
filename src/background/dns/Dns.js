import browser from 'webextension-polyfill';
import dnsData from './dnsData';

class Dns {
    constructor() {
        this.DNS_ENABLED = false;
        // eslint-disable-next-line prefer-destructuring
        this.DNS_SERVER = dnsData.default;
    }

    modifyHeader = (e) => {
        const dnsHeader = {
            name: 'X-Adguard-Resolver',
            value: dnsData[this.DNS_SERVER].ip1,
        };
        e.requestHeaders.push(dnsHeader);
        return { requestHeaders: e.requestHeaders };
    };

    setDnsServer = () => {
        if (this.DNS_SERVER === dnsData.default) {
            return;
        }
        browser.webRequest.onBeforeSendHeaders.addListener(
            this.modifyHeader,
            { urls: ['<all_urls>'] },
            ['blocking', 'requestHeaders']
        );
    };

    disableDns = () => {
        browser.webRequest.onBeforeSendHeaders.removeListener(this.modifyHeader);
    };

    dnsSelect = (dnsServer, proxyEnabled) => {
        this.DNS_SERVER = dnsServer;
        if (proxyEnabled) {
            this.setDnsServer();
        }
    };

    switcher = (dnsEnabled, dnsServer, proxyEnabled) => {
        this.DNS_ENABLED = dnsEnabled;
        this.DNS_SERVER = dnsServer;
        if (!this.DNS_ENABLED || !proxyEnabled) {
            this.disableDns();
        } else if (this.DNS_ENABLED && proxyEnabled) {
            this.setDnsServer();
        }
    };
}

const dns = new Dns();

export default dns;
