import { nanoid } from 'nanoid';
import browser from 'webextension-polyfill';

import pacGenerator from './pacGenerator';
import { ProxyConfigInterface, StorageKey } from '../../schema';
import { PAC_SCRIPT_CHECK_URL } from '../proxyConsts';
import { promisifiedClearProxy, promisifiedGetProxy, promisifiedSetProxy } from './proxySettingsUtils';
import { stateStorage } from '../../stateStorage';
import { log } from '../../../lib/logger';
import { ProxyApiInterface } from '../abstractProxyApi';
import { browserApi } from '../../browserApi';

interface ProxyErrorCallback {
    (details: chrome.proxy.ErrorDetails): void;
}

class ProxyApi implements ProxyApiInterface {
    /**
     * Storage by which proxy config is persisted in the local storage
     */
    PROXY_CONFIG_STORAGE_KEY = 'proxy_config';

    get globalProxyConfig(): ProxyConfigInterface | null {
        return stateStorage.getItem(StorageKey.GlobalProxyConfig) || null;
    }

    set globalProxyConfig(globalProxyConfigValue) {
        stateStorage.setItem(StorageKey.GlobalProxyConfig, globalProxyConfigValue);
        // Store the proxy config in the local storage. This allows the config to be restored after a browser restart,
        // specifically during the 'onAuthRequired' event, even before the extension is fully loaded.
        browserApi.storage.set(this.PROXY_CONFIG_STORAGE_KEY, globalProxyConfigValue);
    }

    /**
     * Converts proxyConfig to chromeConfig
     * @param proxyConfig
     */
    private static convertToChromeConfig = (
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

    /**
     * Handles onAuthRequired events
     * @param details - webrequest details
     * @param callback - callback to be called with authCredentials
     */
    private onAuthRequiredHandler = async (
        details: chrome.webRequest.WebAuthenticationChallengeDetails,
        // callback is optional in chrome.webRequest.onAuthRequired event
        callback?: (response: chrome.webRequest.BlockingResponse) => void,
    ) => {
        log.info('[onAuthRequiredHandler] fired with details:', details);
        if (!callback) {
            log.error('[onAuthRequiredHandler] callback is not defined');
            return;
        }

        const { challenger } = details;

        // Wait for session storage after service worker awoken.
        // This is needed because onAuthRequiredHandler is called before the extension is fully loaded between service
        // worker restarts
        await stateStorage.waitInit();

        // This may happen after browser restart, when the extension is not fully loaded yet
        if (!this.globalProxyConfig) {
            log.info('[onAuthRequiredHandler] globalProxyConfig is not set, wait for the last saved config from storage');
            const lastSavedConfig: ProxyConfigInterface | null = await browserApi.storage.get(
                this.PROXY_CONFIG_STORAGE_KEY,
            ) || null;
            log.info('[onAuthRequiredHandler] last saved config from storage:', lastSavedConfig);
            this.globalProxyConfig = lastSavedConfig;
        }

        if (challenger && challenger.host !== this.globalProxyConfig?.host) {
            log.info(
                `[onAuthRequiredHandler] challenger host: ${challenger.host} is not equal to proxy host: ${this.globalProxyConfig?.host}`,
            );
            callback({});
            return;
        }

        if (this.globalProxyConfig?.credentials) {
            log.info('[onAuthRequiredHandler] credentials are set', this.globalProxyConfig.credentials);
            callback({ authCredentials: this.globalProxyConfig.credentials });
            return;
        }

        log.info('[onAuthRequiredHandler] credentials were not set');
        callback({});
    };

    /**
     * Adds listener for the onAuthRequired event
     */
    private addOnAuthRequiredListener = () => {
        chrome.webRequest.onAuthRequired.addListener(
            this.onAuthRequiredHandler,
            { urls: ['<all_urls>'] },
            ['asyncBlocking'],
        );
    };

    /**
     * As onAuthRequired event is not working reliably, this method sends a random request to
     * PAC_SCRIPT_CHECK_URL, which should be intercepted by proxy endpoint and return empty
     * response with status 200.
     * For example, there is a known bug in Chrome: https://bugs.chromium.org/p/chromium/issues/detail?id=1009243
     * when onAuthRequired is not triggered when request is sent from service worker.
     * When this bug is fixed, this method can be removed.
     */
    private static triggerOnAuthRequired = async () => {
        const HIDDEN_WINDOW_LIFE_MS = 2000;
        try {
            // open hidden window to trigger onAuthRequired
            const hiddenWindow = await browser.windows.create({
                focused: false,
                state: 'minimized',
            });
            await new Promise((resolve) => {
                setTimeout(resolve, HIDDEN_WINDOW_LIFE_MS);
            });
            // close hidden window
            await browser.windows.remove(hiddenWindow.id!);

            // After setting proxy, we need to send a random request. Otherwise, PAC-script can be cached
            await fetch(`http://${nanoid()}.${PAC_SCRIPT_CHECK_URL}`, { cache: 'no-cache' });
        } catch (ex) {
            log.error(`Error while using the workaround to force onAuthRequired: ${ex}`);
        }
    };

    /**
     * proxySet makes proxy settings compatible with Chrome proxy api and sets them via chrome.proxy.settings
     * It is important to note that we set proxy via PAC-script because our exclusions need more complex logic
     * than we can achieve with a fixed_servers option.
     * @param config - proxy config
     */
    public proxySet = async (config: ProxyConfigInterface): Promise<void> => {
        const chromeConfig = ProxyApi.convertToChromeConfig(config);
        await promisifiedSetProxy(chromeConfig);
        this.globalProxyConfig = config;
        await ProxyApi.triggerOnAuthRequired();
    };

    /**
     * Returns proxy config
     * @param config
     */
    public proxyGet = promisifiedGetProxy;

    /**
     * Clears proxy settings
     */
    public proxyClear = async (): Promise<void> => {
        await promisifiedClearProxy();
        this.globalProxyConfig = null;
    };

    /**
     * Adds proxy error listener, which is called when proxy fails to resolve host
     * Used only for logging purposes
     * @param callback
     */
    public onProxyError = {
        addListener: (cb: ProxyErrorCallback) => {
            chrome.proxy.onProxyError.addListener(cb);
        },
        removeListener: (cb: ProxyErrorCallback) => {
            chrome.proxy.onProxyError.removeListener(cb);
        },
    };

    /**
     * Registers onAuthRequired listener for MV3 on top level to wake up the service worker
     * and handles authorization for active proxy only
     */
    public init = (): void => {
        this.addOnAuthRequiredListener();
    };
}

const proxyApi = new ProxyApi();

export { proxyApi };
