import browser from 'webextension-polyfill';
import dnsData from './dnsData';

class Dns {
    constructor() {
        this.DNS_SERVER = 'default';
    }

    appendHeader = (e) => {
        const dnsHeader = {
            name: 'X-Adguard-Resolver',
            value: dnsData[this.DNS_SERVER].ip1,
        };
        e.requestHeaders.push(dnsHeader);
        return { requestHeaders: e.requestHeaders };
    };

    modifyRequestHeader = () => {
        if (this.DNS_SERVER === 'default') {
            browser.webRequest.onBeforeSendHeaders.removeListener(this.appendHeader);
        } else {
            browser.webRequest.onBeforeSendHeaders.addListener(
                this.appendHeader,
                { urls: ['<all_urls>'] },
                ['blocking', 'requestHeaders', 'extraHeaders']
            );
        }
    };

    setDns = (dnsServer, proxyEnabled) => {
        this.DNS_SERVER = dnsServer;
        if (proxyEnabled) {
            this.modifyRequestHeader();
        }
    };
}

const dns = new Dns();

export default dns;
