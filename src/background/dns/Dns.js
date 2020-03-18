import browser from 'webextension-polyfill';
import dnsData from './dnsData';

class Dns {
    constructor() {
        this.DNS_ENABLED = false;
        // eslint-disable-next-line prefer-destructuring
        this.DNS_TYPE = Object.keys(dnsData)[0];
    }

    modifyHeader = (e) => {
        const dnsHeader = {
            name: 'X-Adguard-Resolver',
            value: dnsData[this.DNS_TYPE].ip1,
        };
        e.requestHeaders.push(dnsHeader);
        return { requestHeaders: e.requestHeaders };
    };

    enableDns = () => {
        if (this.DNS_TYPE === Object.keys(dnsData)[0]) {
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

    dnsSelect = (dnsType) => {
        this.DNS_TYPE = dnsType;
        this.enableDns();
    };

    switcher = (dnsEnabled, dnsType) => {
        this.DNS_ENABLED = dnsEnabled;
        this.DNS_TYPE = dnsType;
        if (this.DNS_ENABLED) {
            this.enableDns();
        } else {
            this.disableDns();
        }
    };
}

const dns = new Dns();

export default dns;
