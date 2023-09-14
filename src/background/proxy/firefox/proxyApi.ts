import browser from 'webextension-polyfill';

import { areHostnamesEqual, shExpMatch } from '../../../lib/string-utils';
import { IPV4_REGEX } from '../../routability/constants';
import { convertCidrToNet, isInNet } from '../../routability/utils';
import { getHostname } from '../../../common/url-utils';
import type { AccessCredentials, ProxyConfigInterface } from '../../schema';
import { ProxyApiInterface, ProxyErrorCallback } from '../abstractProxyApi';

/**
 * Defines the ConnectionType enum.
 * Direct means that connection is made directly, without using a proxy.
 */
enum ConnectionType {
    Direct = 'Direct',
}

/**
 * FirefoxProxyConfig interface is used to define the structure of proxy configuration for Firefox.
 * It has optional properties like inverted, bypassList, credentials, defaultExclusions, nonRoutableNets
 * and a mandatory property proxyConfig which is of type proxyConfig.
 */
interface FirefoxProxyConfig {
    inverted?: boolean,
    bypassList?: string[],
    proxyConfig: {
        type: string,
        host?: string,
        port?: number,
        proxyAuthorizationHeader?: string,
    },
    credentials?: AccessCredentials,
    defaultExclusions?: string[],
    nonRoutableNets?: [string, string][],
}

/**
 * ProxyApi class handles all proxy related functionalities.
 * It has the ability to set, get, and clear proxy configurations.
 * It also provides error handling for proxy related issues.
 */
class ProxyApi implements ProxyApiInterface {
    directConfig = { type: ConnectionType.Direct };

    globalFirefoxConfig: FirefoxProxyConfig;

    /**
     * Converts proxyConfig to firefoxConfig
     * @param proxyConfig
     */
    private static convertToFirefoxConfig = (proxyConfig: ProxyConfigInterface): FirefoxProxyConfig => {
        const {
            bypassList,
            host,
            port,
            scheme,
            inverted,
            credentials,
            defaultExclusions,
            nonRoutableCidrNets,
        } = proxyConfig;

        const nonRoutableNets = nonRoutableCidrNets.map((cidr) => convertCidrToNet(cidr));

        const basicAuthCredentials = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');

        return {
            inverted,
            bypassList,
            proxyConfig: {
                type: scheme,
                host,
                port,
                proxyAuthorizationHeader: `Basic ${basicAuthCredentials}`,
            },
            credentials,
            defaultExclusions,
            nonRoutableNets,
        };
    };

    /**
     * Determines if url should be bypassed
     * @param url
     * @param exclusionsPatterns
     */
    private static isBypassed = (url: string, exclusionsPatterns: string[] | undefined) => {
        if (!exclusionsPatterns) {
            return true;
        }

        const hostname = getHostname(url);
        if (!hostname) {
            return false;
        }

        return exclusionsPatterns.some((exclusionPattern) => (
            areHostnamesEqual(hostname, exclusionPattern) || shExpMatch(hostname, exclusionPattern)));
    };

    /**
     * Determines whether the provided URL is non-routable.
     * Non-routable URLs are those that match one of the patterns in the provided nonRoutableNets list.
     * Non-routable networks are typically those reserved for private networks.
     * If the URL does not have a hostname, is not an IPV4, or the nonRoutableNets is not provided or empty,
     * the URL is considered routable.
     *
     * @param url The URL to check.
     * @param nonRoutableNets The list of non-routable network patterns to check against.
     * @returns A boolean indicating whether the URL is non-routable.
     */
    private static isNonRoutable = (url: string, nonRoutableNets: [string, string][] | undefined) => {
        if (!nonRoutableNets || nonRoutableNets.length <= 0) {
            return false;
        }

        const hostname = getHostname(url);
        if (!hostname) {
            return false;
        }

        if (!IPV4_REGEX.test(hostname)) {
            return false;
        }

        return nonRoutableNets.some(([pattern, mask]) => isInNet(hostname, pattern, mask));
    };

    /**
     * The proxyHandler function checks if the given URL is non-routable or bypassed
     * based on the globalFirefoxConfig and returns the appropriate configuration to use.
     * If the URL should be bypassed, the directConfig will be used,
     * otherwise the globalFirefoxConfig will be used.
     * @param details The details of the proxy request.
     */
    private proxyHandler = (details: browser.Proxy.OnRequestDetailsType) => {
        if (ProxyApi.isNonRoutable(details.url, this.globalFirefoxConfig.nonRoutableNets)) {
            return this.directConfig;
        }

        if (ProxyApi.isBypassed(details.url, this.globalFirefoxConfig.defaultExclusions)) {
            return this.directConfig;
        }

        let shouldBypass = ProxyApi.isBypassed(details.url, this.globalFirefoxConfig.bypassList);

        shouldBypass = this.globalFirefoxConfig.inverted ? !shouldBypass : shouldBypass;

        if (shouldBypass) {
            return this.directConfig;
        }

        return this.globalFirefoxConfig.proxyConfig;
    };

    /**
     * Updates proxy config
     * @param proxyConfig
     */
    proxySet = async (proxyConfig: ProxyConfigInterface): Promise<void> => {
        this.globalFirefoxConfig = ProxyApi.convertToFirefoxConfig(proxyConfig);

        if (browser.proxy.onRequest.hasListener(this.proxyHandler)) {
            return;
        }

        browser.proxy.onRequest.addListener(this.proxyHandler, { urls: ['<all_urls>'] });
    };

    /**
     * The proxyGet function returns the current proxy settings.
     * @param config The configuration for getting the proxy settings.
     * @returns A Promise that resolves to the current proxy settings.
     */
    proxyGet = (config = {}): Promise<browser.Types.SettingGetCallbackDetailsType> => {
        return browser.proxy.settings.get(config);
    };

    proxyClear = () => {
        this.globalFirefoxConfig = {
            proxyConfig: this.directConfig,
        };
        browser.proxy.onRequest.removeListener(this.proxyHandler);
    };

    onProxyError = {
        /**
         * Adds a listener function to be called whenever a proxy error occurs.
         * @param cb The callback function to add as a listener.
         */
        addListener: (cb: ProxyErrorCallback) => {
            browser.proxy.onError.addListener(cb);
        },

        /**
         * Removes a listener function so that it is no longer called when a proxy error occurs.
         * @param cb The callback function to remove as a listener.
         */
        removeListener: (cb: ProxyErrorCallback) => {
            browser.proxy.onError.removeListener(cb);
        },
    };

    /**
     * MV3 for firefox browser is not implemented yet, so there is nothing to init
     */
    init = (): void => {
    };
}

const proxyApi = new ProxyApi();

export { proxyApi };
