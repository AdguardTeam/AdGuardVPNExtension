import browser from 'webextension-polyfill';
import { CONNECTION_MODES } from '../proxyConsts';
import pacGenerator from '../../../lib/pacGenerator';

const proxyGet = (config = {}) => new Promise((resolve) => {
    browser.proxy.settings.get(config, (details) => {
        resolve(details);
    });
});

/**
 * @typedef proxyConfig
 * @type {Object}
 * @property {string} mode - proxy mode 'system' or 'fixed_servers'
 * @property {string[]} [bypassList] - array of bypassed values
 * @property {string} [host] - proxy host address
 * @property {number} [port] - proxy port
 * @property {string} [scheme] - proxy scheme
 * e.g.   const config = {
 *            mode: 'system',
 *            bypassList: [],
 *            host: 'feabca59e815de4faab448d75a628118.do-de-fra1-01.adguard.io',
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
const toChromeConfig = (proxyConfig) => {
    const {
        mode, bypassList, host, port, inverted,
    } = proxyConfig;

    let pacScript;
    if (mode === CONNECTION_MODES.SYSTEM) {
        pacScript = pacGenerator.generate();
    } else {
        const proxyAddress = `${host}:${port}`;
        pacScript = pacGenerator.generate(proxyAddress, bypassList, inverted);
    }

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
 * Sets proxy config
 * @param {proxyConfig} config - proxy config
 * @returns {Promise<void>}
 */
const proxySet = config => new Promise((resolve) => {
    const chromeConfig = toChromeConfig(config);
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
    onProxyError,
};

export default proxyApi;
