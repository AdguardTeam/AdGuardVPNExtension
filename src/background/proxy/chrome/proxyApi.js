import browser from 'webextension-polyfill';
import pacGenerator from '../../../lib/pacGenerator';

const proxyGet = (config = {}) => new Promise((resolve) => {
    browser.proxy.settings.get(config, (details) => {
        resolve(details);
    });
});

/**
 * @typedef proxyConfig
 * @type {Object}
 * @property {string[]} [bypassList] - array of bypassed values
 * @property {string} [host] - proxy host address
 * @property {number} [port] - proxy port
 * @property {string} [scheme] - proxy scheme
 * @property {{username: string, password: string}} credentials
 * e.g.   const config = {
 *            bypassList: [],
 *            host: 'do-de-fra1-01.adguard.io',
 *            port: 443,
 *            scheme: 'https',
 *            inverted: false,
 *            credentials: {username: "string", password: "string"},
 *        };
 */

/**
 * @typedef chromeConfig
 * @type {Object}
 *
 * e.g.     const chromeConfig = {
 *               value: {
 *                   mode: "pac_script",
 *                   pacScript: {
 *                       data: "function FindProxyForURL() {return 'DIRECT';}"
 *                   }
 *               },
 *               scope: "regular"
 *           }
 */

/**
 * Converts proxyConfig to chromeConfig
 * @param proxyConfig
 * @returns chromeConfig
 */
const convertToChromeConfig = (proxyConfig) => {
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

let GLOBAL_PROXY_CONFIG = {};

/**
 * Handles onAuthRequired events
 * @param details
 * @returns {{}|{authCredentials: {password: string, username: string}}}
 */
const onAuthRequiredHandler = (details) => {
    const { challenger } = details;

    if (challenger && challenger.host !== GLOBAL_PROXY_CONFIG.host) {
        return {};
    }

    if (GLOBAL_PROXY_CONFIG.credentials) {
        return { authCredentials: GLOBAL_PROXY_CONFIG.credentials };
    }

    return {};
};

const clearAuthCache = async (rootDomain, callback) => {
    // Chrome allow us to clear the authentication credentials for a given
    // domain by clearing ALL cookies for that domain.
    // IMPORTANT: you have to use the root domain of the proxy
    // (eg: if the proxy is at foo.bar.example.com, you need to use example.com).

    const options = {
        origins: [
            `http://${rootDomain}`,
            `https://${rootDomain}`,
        ],
    };
    const types = { cookies: true };

    await browser.browsingData.remove(options, types);
    callback();
};

// Make sure that Chrome does not cache proxy credentials.
// FIXME replace adguard.io with varialbe
clearAuthCache('adguard.io', () => {
    browser.webRequest.onAuthRequired.addListener(onAuthRequiredHandler, { urls: ['<all_urls>'] }, ['blocking']);
});

/**
 * Clears proxy settings
 * @returns {Promise<void>}
 */
const proxyClear = () => new Promise((resolve) => {
    GLOBAL_PROXY_CONFIG = {};
    browser.proxy.settings.clear({}, () => {
        resolve();
    });
});

/**
 * Sets proxy config
 * @param {proxyConfig} config - proxy config
 * @returns {Promise<void>}
 */
const proxySet = (config) => new Promise((resolve) => {
    GLOBAL_PROXY_CONFIG = config;
    const chromeConfig = convertToChromeConfig(config);
    browser.proxy.settings.set(chromeConfig, () => {
        resolve();
    });
});

const onProxyError = (() => {
    return {
        addListener: (cb) => {
            browser.proxy.onProxyError.addListener(cb);
        },
        removeListener: (cb) => {
            browser.proxy.onProxyError.removeListener(cb);
        },
    };
})();

const proxyApi = {
    proxySet,
    proxyGet,
    proxyClear,
    onProxyError,
};

export default proxyApi;
