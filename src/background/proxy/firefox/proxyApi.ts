import browser, { Proxy } from 'webextension-polyfill';
import { Buffer } from 'buffer';

import { areHostnamesEqual, shExpMatch } from '../../../lib/string-utils';
import { IPV4_REGEX } from '../../routability/constants';
import { convertCidrToNet, isInNet } from '../../routability/utils';
import { getHostname } from '../../../common/url-utils';
import type { AccessCredentials, ProxyConfigInterface } from '../../schema';

enum ConnectionType {
    Direct = 'Direct',
}

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

interface ProxyErrorCallback {
    (details: Proxy.OnErrorErrorType): void;
}

/**
 * Converts proxyConfig to firefoxConfig
 * @param proxyConfig
 */
const convertToFirefoxConfig = (proxyConfig: ProxyConfigInterface): FirefoxProxyConfig => {
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

const directConfig = {
    type: ConnectionType.Direct,
};

let globalFirefoxConfig: FirefoxProxyConfig;

const isBypassed = (url: string, exclusionsPatterns: string[] | undefined) => {
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

const isNonRoutable = (url: string, nonRoutableNets: [string, string][] | undefined) => {
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

const proxyHandler = (details: browser.Proxy.OnRequestDetailsType) => {
    if (isNonRoutable(details.url, globalFirefoxConfig.nonRoutableNets)) {
        return directConfig;
    }

    if (isBypassed(details.url, globalFirefoxConfig.defaultExclusions)) {
        return directConfig;
    }

    let shouldBypass = isBypassed(details.url, globalFirefoxConfig.bypassList);

    shouldBypass = globalFirefoxConfig.inverted ? !shouldBypass : shouldBypass;

    if (shouldBypass) {
        return directConfig;
    }

    return globalFirefoxConfig.proxyConfig;
};

/**
 * Updates proxy config
 * @param proxyConfig
 */
const proxySet = async (proxyConfig: ProxyConfigInterface): Promise<void> => {
    globalFirefoxConfig = convertToFirefoxConfig(proxyConfig);

    if (browser.proxy.onRequest.hasListener(proxyHandler)) {
        return;
    }

    browser.proxy.onRequest.addListener(proxyHandler, { urls: ['<all_urls>'] });
};

const onProxyError = (() => {
    return {
        addListener: (cb: ProxyErrorCallback) => {
            browser.proxy.onError.addListener(cb);
        },
        removeListener: (cb: ProxyErrorCallback) => {
            browser.proxy.onError.removeListener(cb);
        },
    };
})();

const proxyGet = (config = {}): Promise<browser.Types.SettingGetCallbackDetailsType> => {
    return browser.proxy.settings.get(config);
};

const proxyClear = () => {
    globalFirefoxConfig = {
        proxyConfig: directConfig,
    };
    browser.proxy.onRequest.removeListener(proxyHandler);
};

/**
 * MV3 for firefox browser is not implemented yet so there is nothing to init
 */
const init = (): void => {};

const proxyApi = {
    proxySet,
    proxyGet,
    proxyClear,
    onProxyError,
    init,
};

export default proxyApi;
