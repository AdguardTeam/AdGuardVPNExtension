import browser from 'webextension-polyfill';

class Dns {
    constructor() {
        this.DNS_ENABLED = false;
        this.DNS_TYPE = 'default';
    }

    modifyHeader = (e) => {
        const dnsHeader = {
            name: 'X-Adguard-Resolver',
            value: this.DNS_TYPE,
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

    switch = (dnsEnabled, dnsType) => {
        this.DNS_ENABLED = dnsEnabled;
        this.DNS_TYPE = dnsType;
        // eslint-disable-next-line no-unused-expressions
        this.DNS_ENABLED ? this.enableDns(this.DNS_TYPE) : this.disableDns();
    };
}

const dns = new Dns();

export default dns;
