import browser from 'webextension-polyfill';

class DNS {
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

    enableDNS = () => {
        browser.webRequest.onBeforeSendHeaders.addListener(
            this.modifyHeader,
            { urls: ['<all_urls>'] },
            ['blocking', 'requestHeaders']
        );
    };

    disableDNS = () => {
        browser.webRequest.onBeforeSendHeaders.removeListener(this.modifyHeader);
    };

    switch = (DNSEnabled, DNSType) => {
        this.DNS_ENABLED = DNSEnabled;
        this.DNS_TYPE = DNSType;
        // eslint-disable-next-line no-unused-expressions
        this.DNS_ENABLED ? this.enableDNS(this.DNS_TYPE) : this.disableDNS();
    };
}

const dns = new DNS();

export default dns;
