import browser from 'webextension-polyfill';
import { getHostname } from '../../../lib/helpers';
import { CONNECTION_TYPE_FIREFOX } from '../proxyConsts';
import { areHostnamesEqual, shExpMatch } from '../../../lib/string-utils';
import { IPv4Regex } from '../../routability/constants';
import { convertCidrToNet, isInNet } from '../../routability/utils';

/**
 * @typedef proxyConfig
 * @type {Object}
 * @property {string[]} [bypassList] - array of bypassed values
 * @property {string} [host] - proxy host address
 * @property {number} [port] - proxy port
 * @property {string} [scheme] - proxy scheme
 * @property {{username: string, password: string}} credentials
 * e.g.   const config = {
 *            bypassList: ['example.org', 'localhost', '0.0.0.0/8'],
 *            host: 'do-de-fra1-01.adguard.io',
 *            port: 443,
 *            scheme: 'https',
 *            inverted: false,
 *            credentials: {
 *                username: 'foo',
 *                password: 'bar',
 *            }
 *        };
 */

/**
 * @typedef firefoxConfig
 * @type {Object}
 *
 * e.g.     const firefoxConfig = {
 *              bypassList: ['example.org', 'localhost', '0.0.0.0/8'],
 *              proxyConfig: {
 *                  type: "https",
 *                  host: "do-de-fra1-01.adguard.io",
 *                  port: 443
 *              },
 *              credentials: {
 *                  username: 'foo',
 *                  password: 'bar',
 *              }
 *          };
 */

/**
 * Converts proxyConfig to chromeConfig
 * @param proxyConfig
 * @returns {firefoxConfig}
 */
const convertToFirefoxConfig = (proxyConfig) => {
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

let GLOBAL_FIREFOX_CONFIG = {
    proxyConfig: directConfig,
};

const isBypassed = (url, exclusionsPatterns) => {
    if (!exclusionsPatterns) {
        return true;
    }
    const hostname = getHostname(url);

    return exclusionsPatterns.some((exclusionPattern) => (
        areHostnamesEqual(hostname, exclusionPattern) || shExpMatch(hostname, exclusionPattern)));
};

const isNonRoutable = (url, nonRoutableNets) => {
    if (!nonRoutableNets || nonRoutableNets.length <= 0) {
        return false;
    }

    const hostname = getHostname(url);
    if (!IPv4Regex.test(hostname)) {
        return false;
    }

    return nonRoutableNets.some(([pattern, mask]) => isInNet(hostname, pattern, mask));
};

const onAuthRequiredHandler = (details) => {
    const { challenger } = details;
    if (challenger && challenger.host !== GLOBAL_FIREFOX_CONFIG.proxyConfig.host) {
        return {};
    }

    return { authCredentials: GLOBAL_FIREFOX_CONFIG.credentials };
};

const addAuthHandler = () => {
    if (browser.webRequest.onAuthRequired.hasListener(onAuthRequiredHandler)) {
        return;
    }
    browser.webRequest.onAuthRequired.addListener(onAuthRequiredHandler, { urls: ['<all_urls>'] }, ['blocking']);
};

const removeAuthHandler = () => {
    browser.webRequest.onAuthRequired.removeListener(onAuthRequiredHandler);
};

const proxyHandler = (details) => {
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
const proxySet = async (proxyConfig) => {
    GLOBAL_FIREFOX_CONFIG = convertToFirefoxConfig(proxyConfig);
    if (browser.proxy.onRequest.hasListener(proxyHandler)) {
        return;
    }
    browser.proxy.onRequest.addListener(proxyHandler, { urls: ['<all_urls>'] });
    addAuthHandler();
};

const onProxyError = (() => {
    return {
        addListener: (cb) => {
            browser.proxy.onError.addListener(cb);
        },
        removeListener: (cb) => {
            browser.proxy.onError.removeListener(cb);
        },
    };
})();

const proxyGet = (config = {}) => new Promise((resolve) => {
    browser.proxy.settings.get(config, (details) => {
        resolve(details);
    });
});

const proxyClear = () => {
    GLOBAL_FIREFOX_CONFIG = {
        proxyConfig: directConfig,
    };
    browser.proxy.onRequest.removeListener(proxyHandler);
    removeAuthHandler();
};

const proxyApi = {
    proxySet,
    proxyGet,
    proxyClear,
    onProxyError,
};

export default proxyApi;
