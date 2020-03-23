import browser from 'webextension-polyfill';
import dnsData from './dnsData';
import proxy from '../proxy';
import { DNS_DEFAULT, ADG_DNS_HEADER } from './dnsConsts';

class Dns {
    constructor() {
        this.DNS_SERVER = DNS_DEFAULT;
    }

    appendHeader = (requestDetails) => {
        const dnsHeader = {
            name: ADG_DNS_HEADER,
            value: dnsData[this.DNS_SERVER].ip1,
        };
        requestDetails.requestHeaders.push(dnsHeader);
        return { requestHeaders: requestDetails.requestHeaders };
    };

    isProxyRequest = (host, exclusionsList, inverted, defaultExclusions) => {
        if (!host.includes('.') || defaultExclusions.some((el) => host.includes(el.replace('*', '')))) {
            return false;
        }
        if (exclusionsList.some((el) => host.includes(el.replace('*', '')))) {
            return inverted;
        }
        return !inverted;
    };

    modifyProxyRequestsOnly = (requestDetails) => {
        const proxyConfig = proxy.getConfig();
        const isProxyRequest = this.isProxyRequest(
            requestDetails.url,
            proxyConfig.bypassList,
            proxyConfig.inverted,
            proxyConfig.defaultExclusions
        );
        if (isProxyRequest) {
            this.appendHeader(requestDetails);
        }
    };

    modifyRequestHeader = () => {
        browser.webRequest.onBeforeSendHeaders.addListener(
            this.modifyProxyRequestsOnly,
            { urls: ['<all_urls>'] },
            ['blocking', 'requestHeaders', 'extraHeaders']
        );
    };

    removeRequestHeader = () => {
        if (browser.webRequest.onBeforeSendHeaders.hasListener(this.modifyProxyRequestsOnly)) {
            browser.webRequest.onBeforeSendHeaders.removeListener(this.modifyProxyRequestsOnly);
        }
    };

    setDns = (dnsServer, proxyEnabled) => {
        this.DNS_SERVER = dnsServer;
        if (proxyEnabled && this.DNS_SERVER !== DNS_DEFAULT) {
            this.modifyRequestHeader();
        } else {
            this.removeRequestHeader();
        }
    };
}

const dns = new Dns();

export default dns;
