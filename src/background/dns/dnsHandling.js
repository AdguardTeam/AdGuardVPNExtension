import browser from 'webextension-polyfill';
import dnsList from './dnsData';

class Dns {
    constructor() {
        this.DNS_ENABLED = false;
        // eslint-disable-next-line prefer-destructuring
        this.DNS_TYPE = Object.keys(dnsList)[0];
    }

    modifyHeader = (e) => {
        const dnsHeader = {
            name: 'X-Adguard-Resolver',
            value: dnsList[this.DNS_TYPE].ip1,
        };
        e.requestHeaders.push(dnsHeader);
        return { requestHeaders: e.requestHeaders };
    };

    enableDns = () => {
        browser.webRequest.onBeforeSendHeaders.addListener(
            this.modifyHeader,
            { urls: ['<all_urls>'] },
            ['blocking', 'requestHeaders']
        );
    };

    disableDns = () => {
        browser.webRequest.onBeforeSendHeaders.removeListener(this.modifyHeader);
    };

    controller = (dnsEnabled, dnsType) => {
        this.DNS_ENABLED = dnsEnabled;
        this.DNS_TYPE = dnsType;
        if (this.DNS_ENABLED) {
            this.enableDns(this.DNS_TYPE);
        } else {
            this.disableDns();
        }
    };
}

const dns = new Dns();

export default dns;
