import browser from 'webextension-polyfill';

import { CONNECTION_TYPE_FIREFOX } from '../proxyConsts';
import { areHostnamesEqual, shExpMatch } from '../../../lib/string-utils';
import { IPV4_REGEX } from '../../routability/constants';
import { convertCidrToNet, isInNet } from '../../routability/utils';
import { getHostname } from '../../../common/url-utils';
import { ConfigData } from '../index';

interface ProxyApi {
    proxySet(proxyConfig: ConfigData): Promise<void>;
    proxyGet(config: ConfigData): Promise<browser.Types.SettingGetCallbackDetailsType>;
    proxyClear(): void;
    onProxyError: {
        addListener: (cb: () => void) => void,
        removeListener: (cb: () => void) => void,
    };
    clearAuthCache(): void;
}

interface ProxyConfig {
    inverted?: boolean;
    bypassList?: string[];
    proxyConfig: {
        type: string,
        host?: string | null,
        port?: number,
    };
    credentials?: {
        username: string,
        password: string,
    };
    defaultExclusions?: string[];
    nonRoutableNets?: string[][];
}

/**
 * Converts ConfigData to ProxyConfig
 * @param configData
 * @returns {firefoxConfig}
 */
const convertToFirefoxConfig = (configData: ConfigData): ProxyConfig => {
    const {
        bypassList,
        host,
        port,
        scheme,
        inverted,
        credentials,
        defaultExclusions,
        nonRoutableCidrNets,
    } = configData;

    return {
        inverted,
        bypassList,
        proxyConfig: {
            type: scheme,
            host,
            port,
        },
        credentials,
        defaultExclusions,
        nonRoutableNets: nonRoutableCidrNets.map(convertCidrToNet),
    };
};

const directConfig = {
    type: CONNECTION_TYPE_FIREFOX.DIRECT,
};

let GLOBAL_FIREFOX_CONFIG: ProxyConfig = {
    proxyConfig: directConfig,
};

const isBypassed = (url: string, exclusionsPatterns?: string[]): boolean => {
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

const isNonRoutable = (url: string, nonRoutableNets?: string[][]): boolean => {
    if (!nonRoutableNets || nonRoutableNets.length <= 0) {
        return false;
    }

    const hostname = getHostname(url);
    if (!hostname || !IPV4_REGEX.test(hostname)) {
        return false;
    }

    return nonRoutableNets.some(([pattern, mask]) => isInNet(hostname, pattern, mask));
};

const onAuthRequiredHandler = (
    details: browser.WebRequest.OnAuthRequiredDetailsType,
): { authCredentials: { username: string, password: string } } | {} => {
    const { challenger } = details;
    if (challenger && challenger.host !== GLOBAL_FIREFOX_CONFIG.proxyConfig.host) {
        return {};
    }

    return { authCredentials: GLOBAL_FIREFOX_CONFIG.credentials };
};

const addAuthHandler = (): void => {
    if (browser.webRequest.onAuthRequired.hasListener(onAuthRequiredHandler)) {
        return;
    }
    browser.webRequest.onAuthRequired.addListener(onAuthRequiredHandler, { urls: ['<all_urls>'] }, ['blocking']);
};

const removeAuthHandler = (): void => {
    browser.webRequest.onAuthRequired.removeListener(onAuthRequiredHandler);
};

const proxyHandler = (details: browser.WebRequest.OnBeforeRequestDetailsType) => {
    if (isNonRoutable(details.url, GLOBAL_FIREFOX_CONFIG.nonRoutableNets)) {
        return directConfig;
    }

    if (isBypassed(details.url, GLOBAL_FIREFOX_CONFIG.defaultExclusions)) {
        return directConfig;
    }

    let shouldBypass = isBypassed(details.url, GLOBAL_FIREFOX_CONFIG.bypassList);

    shouldBypass = GLOBAL_FIREFOX_CONFIG.inverted ? !shouldBypass : shouldBypass;

    if (shouldBypass) {
        return directConfig;
    }

    return GLOBAL_FIREFOX_CONFIG.proxyConfig;
};

/**
 * Updates proxy config
 * @param {proxyConfig} proxyConfig
 * @returns {Promise<void>}
 */
const proxySet = async (proxyConfig: ConfigData): Promise<void> => {
    GLOBAL_FIREFOX_CONFIG = convertToFirefoxConfig(proxyConfig);
    if (browser.proxy.onRequest.hasListener(proxyHandler)) {
        return;
    }
    browser.proxy.onRequest.addListener(proxyHandler, { urls: ['<all_urls>'] });
    addAuthHandler();
};

const onProxyError = (() => {
    return {
        addListener: (cb: () => void) => {
            browser.proxy.onError.addListener(cb);
        },
        removeListener: (cb: () => void) => {
            browser.proxy.onError.removeListener(cb);
        },
    };
})();

const proxyGet = async (config = {}): Promise<browser.Types.SettingGetCallbackDetailsType> => {
    return browser.proxy.settings.get(config);
};

const proxyClear = (): void => {
    GLOBAL_FIREFOX_CONFIG = {
        proxyConfig: directConfig,
    };
    browser.proxy.onRequest.removeListener(proxyHandler);
    removeAuthHandler();
};

const clearAuthCache = () => {};

export const proxyApi: ProxyApi = {
    proxySet,
    proxyGet,
    proxyClear,
    onProxyError,
    clearAuthCache,
};
