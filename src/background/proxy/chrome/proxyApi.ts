import pacGenerator from '../../../lib/pacGenerator';
import { ConfigData } from '../index';

interface ProxyApi {
    proxySet(config: ConfigData): Promise<void>;
    proxyGet(config?: ConfigData): Promise<chrome.types.ChromeSettingGetResultDetails>;
    proxyClear(): Promise<void>;
    onProxyError: {
        addListener: (cb: () => void) => void,
        removeListener: (cb: () => void) => void,
    };
}

const DEFAULT_PROXY_CONFIG = {
    bypassList: [''],
    defaultExclusions: [''],
    nonRoutableCidrNets: [''],
    host: null,
    port: 0,
    scheme: '',
    inverted: false,
    credentials: {
        username: '',
        password: '',
    },
};

let GLOBAL_PROXY_CONFIG: ConfigData = DEFAULT_PROXY_CONFIG;

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

/**
 * Handles onAuthRequired events
 * @param details
 * @returns {{}|{authCredentials: {password: string, username: string}}}
 */
const onAuthRequiredHandler = (details: chrome.webRequest.WebAuthenticationChallengeDetails) => {
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
 * Chrome allow us to clear the authentication credentials for a given
 * domain by clearing ALL cookies for that domain.
 * @param rootDomain
 * @param callback
 */
const clearAuthCache = async (rootDomain: string, callback: () => void) => {
    // IMPORTANT: you have to use the root domain of the proxy
    // (eg: if the proxy is at foo.bar.example.com, you need to use example.com).
    const options = {
        origins: [
            `http://${rootDomain}`,
            `https://${rootDomain}`,
        ],
    };
    const types = { cookies: true };

    await chrome.browsingData.remove(options, types);
    callback();
};

// Make sure that Chrome does not cache proxy credentials.
// FIXME replace adguard.io with varialbe
clearAuthCache('adguard.io', () => {
    chrome.webRequest.onAuthRequired.addListener(onAuthRequiredHandler, { urls: ['<all_urls>'] }, ['blocking']);
});

/**
 * Sets proxy config
 * @param {proxyConfig} config - proxy config
 * @returns {Promise<void>}
 */
const proxySet = (config: ConfigData): Promise<void> => new Promise((resolve) => {
    GLOBAL_PROXY_CONFIG = config;
    const chromeConfig = convertToChromeConfig(config);
    chrome.proxy.settings.set(chromeConfig, () => {
        resolve();
    });
});

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
    GLOBAL_PROXY_CONFIG = DEFAULT_PROXY_CONFIG;
    chrome.proxy.settings.clear({}, () => {
        resolve();
    });
});

const onProxyError = (() => {
    return {
        addListener: (cb: () => void) => {
            chrome.proxy.onProxyError.addListener(cb);
        },
        removeListener: (cb: () => void) => {
            chrome.proxy.onProxyError.removeListener(cb);
        },
    };
})();

export const proxyApi: ProxyApi = {
    proxySet,
    proxyGet,
    proxyClear,
    onProxyError,
};
