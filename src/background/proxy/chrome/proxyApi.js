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
 * e.g.   const config = {
 *            bypassList: [],
 *            host: 'do-de-fra1-01.adguard.io',
 *            port: 443,
 *            scheme: 'https',
 *            inverted: false,
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
        bypassList, host, port, inverted, defaultExclusions,
    } = proxyConfig;

    const proxyAddress = `${host}:${port}`;
    const pacScript = pacGenerator.generate(proxyAddress, bypassList, inverted, defaultExclusions);

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
 * Clears proxy settings
 * @returns {Promise<void>}
 */
const proxyClear = () => new Promise((resolve) => {
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
