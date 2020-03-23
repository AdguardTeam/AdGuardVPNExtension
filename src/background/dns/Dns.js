import browser from 'webextension-polyfill';
import dnsData from './dnsData';
import proxy from '../proxy';
import { DNS_DEFAULT, ADG_DNS_HEADER } from './dnsConsts';

class Dns {
    constructor() {
        this.DNS_SERVER = DNS_DEFAULT;
    }

    setDns = (dnsServer, proxyEnabled) => {
        this.DNS_SERVER = dnsServer;
        if (proxyEnabled && this.DNS_SERVER !== DNS_DEFAULT) {
            this.modifyRequestHeader();
        } else {
            this.removeRequestHeader();
        }
    };

    modifyRequestHeader = () => {
        browser.webRequest.onBeforeSendHeaders.addListener(
            this.appendHeader,
            { urls: ['<all_urls>'] },
            ['blocking', 'requestHeaders', 'extraHeaders']
        );
    };

    removeRequestHeader = () => {
        if (browser.webRequest.onBeforeSendHeaders.hasListener(this.appendHeader)) {
            browser.webRequest.onBeforeSendHeaders.removeListener(this.appendHeader);
        }
    };

    appendHeader = (requestDetails) => {
        if (this.isProxyRequest(requestDetails.url)) {
            const dnsHeader = {
                name: ADG_DNS_HEADER,
                value: dnsData[this.DNS_SERVER].ip1,
            };
            requestDetails.requestHeaders.push(dnsHeader);
        }
        return { requestHeaders: requestDetails.requestHeaders };
    };

    isProxyRequest = (requestUrl) => {
        const proxyConfig = proxy.getConfig();
        const { bypassList, inverted, defaultExclusions } = proxyConfig;

        if (!requestUrl.includes('.')
            || defaultExclusions.some((exclusion) => requestUrl.includes(exclusion.replace('*', '')))) {
            return false;
        }
        if (bypassList.some((exclusion) => requestUrl.includes(exclusion.replace('*', '')))) {
            return inverted;
        }
        return !inverted;
    };
}

const dns = new Dns();

export default dns;
