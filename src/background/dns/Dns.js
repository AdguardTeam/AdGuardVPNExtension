import browser from 'webextension-polyfill';
import dnsData from './dnsData';
import proxy from '../proxy';
import { DNS_DEFAULT, ADG_DNS_HEADER } from './dnsConsts';
import log from '../../lib/logger';

class Dns {
    constructor() {
        this.dnsServer = DNS_DEFAULT;
    }

    setDns = (dnsServer, proxyEnabled) => {
        if (this.dnsServer !== dnsServer) {
            this.turnOffDns();
        }
        this.dnsServer = dnsServer;
        if (proxyEnabled && this.dnsServer !== DNS_DEFAULT) {
            this.turnOnDns();
        } else {
            this.turnOffDns();
        }
    };

    turnOnDns = () => {
        this.addHeadersHandler();
    };

    turnOffDns = () => {
        this.removeHeadersHandler();
    };

    addHeadersHandler = () => {
        browser.webRequest.onBeforeSendHeaders.addListener(
            this.headersHandler,
            { urls: ['<all_urls>'] },
            ['blocking', 'requestHeaders', 'extraHeaders']
        );
        log.info(`DNS "${this.dnsServer}" enabled`);
    };

    removeHeadersHandler = () => {
        if (browser.webRequest.onBeforeSendHeaders.hasListener(this.headersHandler)) {
            browser.webRequest.onBeforeSendHeaders.removeListener(this.headersHandler);
            log.info(`DNS "${this.dnsServer}" disabled`);
        }
    };

    headersHandler = (requestDetails) => {
        if (this.isProxyRequest(requestDetails.url)) {
            const dnsHeader = {
                name: ADG_DNS_HEADER,
                value: dnsData[this.dnsServer].ip1,
            };
            requestDetails.requestHeaders.push(dnsHeader);
            log.debug(`\nReguest URL: ${requestDetails.url}\nThe header "${dnsHeader.name}: ${dnsHeader.value}" was added into request for ${this.dnsServer}`);
        }
        return { requestHeaders: requestDetails.requestHeaders };
    };

    isProxyRequest = (requestUrl) => {
        const proxyConfig = proxy.getConfig();
        const { bypassList, inverted, defaultExclusions } = proxyConfig;

        if (!requestUrl.includes('.')
            || defaultExclusions.some((exclusion) => requestUrl.includes(exclusion.replace('*', '')))) {
            return true;
        }
        if (bypassList.some((exclusion) => requestUrl.includes(exclusion.replace('*', '')))) {
            return inverted;
        }
        return !inverted;
    };
}

const dns = new Dns();

export default dns;
