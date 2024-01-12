import pacGenerator from './pacGenerator';
import { ProxyConfigInterface, StorageKey } from '../../schema';
import { promisifiedClearProxy, promisifiedGetProxy, promisifiedSetProxy } from './proxySettingsUtils';
import { stateStorage } from '../../stateStorage';
import { log } from '../../../lib/logger';
import { ProxyApiInterface } from '../abstractProxyApi';
import { browserApi } from '../../browserApi';
import { proxyAuthTrigger } from './proxyAuthTrigger';

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
     * Checks if we need to trigger onAuthRequired event, we added this check because the trigger for mv3 looks awfully,
     * and we want to do it as less as possible
     * @param oldConfig
     * @param newConfig
     */
    shouldApplyProxyAuthTrigger = (
        oldConfig: ProxyConfigInterface | null,
        newConfig: ProxyConfigInterface | null,
    ): boolean => {
        // if the new config is null, then there is no need to trigger onAuthRequired
        if (!newConfig) {
            return false;
        }

        // if the old config is null, then we need to trigger onAuthRequired
        if (!oldConfig) {
            return true;
        }

        // if the host, username or password changed, then we need to trigger onAuthRequired
        return oldConfig.host !== newConfig.host
            || oldConfig.credentials.password !== newConfig.credentials.password
            || oldConfig.credentials.username !== newConfig.credentials.username;
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
        if (this.shouldApplyProxyAuthTrigger(this.globalProxyConfig, config)) {
            // we do not wait for the promise to resolve because we don't want to block the main thread
            proxyAuthTrigger.run();
        }
        this.globalProxyConfig = config;
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
