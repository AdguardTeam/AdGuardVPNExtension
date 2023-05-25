import { nanoid } from 'nanoid';

import pacGenerator from './pacGenerator';
import { AccessCredentials, ProxyConfigInterface } from '../../schema';
import { PAC_SCRIPT_CHECK_URL } from '../proxyConsts';
import { browserApi } from '../../browserApi';
import { proxy } from '../proxy';

type AuthHandler = (details: chrome.webRequest.WebAuthenticationChallengeDetails) => {
    authCredentials?: AccessCredentials,
};

/**
 * Returns proxy config
 * @param config
 */
const proxyGet = (config = {}) => new Promise((resolve) => {
    chrome.proxy.settings.get(config, (details) => {
        resolve(details);
    });
});

/**
 * Converts proxyConfig to chromeConfig
 * @param proxyConfig
 */
const convertToChromeConfig = (
    proxyConfig: ProxyConfigInterface,
): chrome.types.ChromeSettingSetDetails => {
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

let globalProxyConfig: ProxyConfigInterface | null = null;

/**
 * Handles onAuthRequired events
 * @param details - webrequest details
 */
const onAuthRequiredHandler = (details: chrome.webRequest.WebAuthenticationChallengeDetails) => {
    const { challenger } = details;

    if (challenger && challenger.host !== globalProxyConfig?.host) {
        return {};
    }

    if (globalProxyConfig?.credentials) {
        return { authCredentials: globalProxyConfig.credentials };
    }

    return {};
};

/**
 * Handles onAuthRequired events only if proxy is active
 * @param details
 */
const onAuthRequiredHandlerForActiveProxy = (details: chrome.webRequest.WebAuthenticationChallengeDetails) => {
    return proxy.isActive ? onAuthRequiredHandler(details) : {};
};

/**
 * Adds listener for the onAuthRequired event
 * @param handler
 */
const addOnAuthRequiredListener = (handler: AuthHandler) => {
    chrome.webRequest.onAuthRequired.addListener(handler, { urls: ['<all_urls>'] }, ['blocking']);
};

const removeOnAuthRequiredListener = () => {
    chrome.webRequest.onAuthRequired.removeListener(onAuthRequiredHandler);
};

const promisifiedClearProxy = (): Promise<void> => {
    return new Promise((resolve) => {
        chrome.proxy.settings.clear({}, () => {
            resolve();
        });
    });
};

/**
 * Clears proxy settings
 */
const proxyClear = async (): Promise<void> => {
    await promisifiedClearProxy();
    globalProxyConfig = null;
};

const promisifiedSetProxy = (config: chrome.types.ChromeSettingSetDetails): Promise<void> => {
    return new Promise((resolve) => {
        chrome.proxy.settings.set(config, () => {
            resolve();
        });
    });
};

/**
 * As onAuthRequired event is not working reliably this method sends random request to
 * PAC_SCRIPT_CHECK_URL, which should be intercepted by proxy endpoint and return empty
 * response with status 200.
 * For example there is a known bug in Chrome: https://bugs.chromium.org/p/chromium/issues/detail?id=1009243
 * when onAuthRequired is not triggered when request is sent from service worker.
 * When this bug is fixed, this method can be removed.
 */
async function triggerOnAuthRequired() {
    try {
        // After setting proxy we need to send a random request, otherwise PAC script can be cached
        await fetch(`http://${nanoid()}.${PAC_SCRIPT_CHECK_URL}`, { cache: 'no-cache' });
    } catch (e) {
        // ignore
    }
}

/**
 * proxySet makes proxy settings compatible with Chrome proxy api and sets them via chrome.proxy.settings
 * It is important to note that we set proxy via pac script because our exclusions need more complex logic than we can
 * achieve with fixed_servers option.
 * @param config - proxy config
 */
const proxySet = async (config: ProxyConfigInterface): Promise<void> => {
    removeOnAuthRequiredListener();
    const chromeConfig = convertToChromeConfig(config);
    await promisifiedSetProxy(chromeConfig);
    globalProxyConfig = config;
    // Register onAuthRequired listener for MV2 to handle proxy authorization
    if (browserApi.runtime.isManifestVersion2()) {
        addOnAuthRequiredListener(onAuthRequiredHandler);
    }
    await triggerOnAuthRequired();
};

interface ProxyErrorCallback {
    (details: chrome.proxy.ErrorDetails): void;
}

/**
 * Adds proxy error listener, which is called when proxy fails to resolve host
 * Used only for logging purposes
 * @param callback
 */
const onProxyError = (() => {
    return {
        addListener: (cb: ProxyErrorCallback) => {
            chrome.proxy.onProxyError.addListener(cb);
        },
        removeListener: (cb: ProxyErrorCallback) => {
            chrome.proxy.onProxyError.removeListener(cb);
        },
    };
})();

/**
 * Registers onAuthRequired listener for MV3 on top level to wake up the service worker
 * and handles authorization for active proxy only
 */
const init = (): void => {
    addOnAuthRequiredListener(onAuthRequiredHandlerForActiveProxy);
};

const proxyApi = {
    proxySet,
    proxyGet,
    proxyClear,
    onProxyError,
    init,
};

export default proxyApi;
