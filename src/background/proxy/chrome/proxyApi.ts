import pacGenerator from '../../../lib/pacGenerator';
import { getETld } from '../../../common/url-utils';
import { ProxyApiInterface, ConfigData } from '../ProxyApiTypes';

let GLOBAL_PROXY_CONFIG: ConfigData | null = null;

/**
 * Converts proxyConfig to chromeConfig
 * @param proxyConfig
 * @returns chromeConfig
 */
const convertToChromeConfig = (proxyConfig: ConfigData): chrome.types.ChromeSettingSetDetails => {
    const {
        bypassList,
        host,
        port,
        inverted,
        defaultExclusions,
        nonRoutableCidrNets,
    } = proxyConfig;

    const proxyAddress = `${host}:${port}`;
    const pacScript = pacGenerator.generate(
        proxyAddress,
        bypassList,
        inverted,
        defaultExclusions,
        nonRoutableCidrNets,
    );

    return {
        value: {
            mode: 'pac_script',
            pacScript: {
                data: pacScript,
            },
        },
        scope: 'regular',
    };
};

type OnAuthRequiredHandlerResponse = {
    authCredentials: {
        username: string,
        password: string,
    }
};

/**
 * Handles onAuthRequired events
 * @param details
 * @returns {{}|{authCredentials: {password: string, username: string}}}
 */
const onAuthRequiredHandler = (
    details: chrome.webRequest.WebAuthenticationChallengeDetails,
): OnAuthRequiredHandlerResponse | {} => {
    if (!GLOBAL_PROXY_CONFIG) {
        return {};
    }

    const { challenger } = details;

    if (challenger && challenger.host !== GLOBAL_PROXY_CONFIG.host) {
        return {};
    }

    if (GLOBAL_PROXY_CONFIG.credentials) {
        return { authCredentials: GLOBAL_PROXY_CONFIG.credentials };
    }

    return {};
};

/**
 * Promisified chrome.browsingData.remove
 * @param options
 * @param types
 */
const removeChromeBrowsingData = (
    options: chrome.browsingData.RemovalOptions,
    types: chrome.browsingData.DataTypeSet,
): Promise<void> => {
    return new Promise((resolve, reject) => {
        chrome.browsingData.remove(options, types, () => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            }
            resolve();
        });
    });
};

/**
 * Clears the authentication credentials for a given
 * domain by clearing ALL cookies for that domain.
 * @param hostname
 */
const clearAuthCache = async (hostname: string): Promise<void> => {
    // IMPORTANT: you have to use the root domain of the proxy
    // (eg: if the proxy is at foo.bar.example.com, you need to use example.com).
    const rootDomain = getETld(hostname);

    const options = {
        origins: [
            `http://${rootDomain}`,
            `https://${rootDomain}`,
        ],
    };
    const types = { cookies: true };

    await removeChromeBrowsingData(options, types);
};

/**
 * Promisified chrome.proxy.settings.set
 * @param chromeConfig
 */
const chromeProxySet = (chromeConfig: chrome.types.ChromeSettingSetDetails): Promise<void> => {
    return new Promise((resolve) => {
        chrome.proxy.settings.set(chromeConfig, () => {
            resolve();
        });
    });
};

/**
 * Sets proxy config
 * @param {proxyConfig} config - proxy config
 * @returns {Promise<void>}
 */
const proxySet = async (config: ConfigData): Promise<void> => {
    GLOBAL_PROXY_CONFIG = config;
    const chromeConfig = convertToChromeConfig(config);

    chrome.webRequest.onAuthRequired.removeListener(onAuthRequiredHandler);
    await clearAuthCache(config.host);
    await chromeProxySet(chromeConfig);
    chrome.webRequest.onAuthRequired.addListener(onAuthRequiredHandler, { urls: ['<all_urls>'] }, ['blocking']);
};

const proxyGet = (
    config = {},
): Promise<chrome.types.ChromeSettingGetResultDetails> => new Promise((resolve) => {
    chrome.proxy.settings.get(config, (details) => {
        resolve(details);
    });
});

/**
 * Clears proxy settings
 * @returns {Promise<void>}
 */
const proxyClear = (): Promise<void> => new Promise((resolve) => {
    GLOBAL_PROXY_CONFIG = null;
    chrome.webRequest.onAuthRequired.removeListener(onAuthRequiredHandler);
    chrome.proxy.settings.clear({}, () => {
        resolve();
    });
});

const onProxyError = (() => {
    return {
        addListener: (cb: (details: any) => void) => {
            chrome.proxy.onProxyError.addListener(cb);
        },
        removeListener: (cb: (details: any) => void) => {
            chrome.proxy.onProxyError.removeListener(cb);
        },
    };
})();

export const proxyApi: ProxyApiInterface = {
    proxySet,
    proxyGet,
    proxyClear,
    onProxyError,
};
