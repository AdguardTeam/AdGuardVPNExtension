import { type ProxyConfigInterface, StorageKey } from '../../schema';
import { stateStorage } from '../../stateStorage';
import { log } from '../../../common/logger';
import { type ProxyApiInterface } from '../abstractProxyApi';
import { browserApi } from '../../browserApi';
import { getETld } from '../../../common/utils/url';

import {
    promisifiedClearProxy,
    promisifiedGetProxy,
    promisifiedSetProxy,
    promisifiedRemoveBrowsingData,
} from './proxySettingsUtils';
import pacGenerator from './pacGenerator';
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
     * Clears proxy credentials cache for the given host.
     *
     * NOTE: This method uses a hack by clearing cookies for the top-level
     * domain of the host, so, reliability of this method is not guaranteed.
     *
     * @see {@link https://developer.chrome.com/docs/extensions/reference/api/browsingData#properties_1}
     * @see {@link https://stackoverflow.com/a/66896099}
     *
     * @param host Host for which proxy credentials cache should be cleared.
     */
    private static async clearProxyHostCredentialsCache(host: string): Promise<void> {
        try {
            const topLevelDomain = getETld(host);
            if (!topLevelDomain) {
                log.warn(`Could not determine top-level domain for host '${host}' while clearing proxy credentials cache`);
                return;
            }

            /**
             * For removing cookies data we need to specify only top-level domain.
             *
             * @see {@link https://developer.chrome.com/docs/extensions/reference/api/browsingData#properties_1}
             */
            const options: chrome.browsingData.RemovalOptions = {
                origins: [
                    `https://${topLevelDomain}`,
                    `http://${topLevelDomain}`,
                ],
            };

            /**
             * This is a hack used to clear proxy credentials cache.
             * When we specify `cookies` data type, it also appears
             * to clear the proxy credentials cache.
             *
             * @see {@link https://stackoverflow.com/a/66896099}
             */
            const dataToRemove: chrome.browsingData.DataTypeSet = {
                cookies: true,
            };

            await promisifiedRemoveBrowsingData(options, dataToRemove);
        } catch (error) {
            log.error('Error clearing proxy credentials cache:', error);
        }
    }

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
        // This is needed because onAuthRequiredHandler is called before
        // the extension is fully loaded between service worker restarts
        try {
            await stateStorage.init();
        } catch (e) {
            log.error('Error on waiting for state storage to init', e);
        }

        // This may happen after browser restart, when the extension is not fully loaded yet
        if (!this.globalProxyConfig) {
            log.info('[onAuthRequiredHandler] globalProxyConfig is not set, wait for the last saved config from storage');
            let lastSavedConfig: ProxyConfigInterface | null = null;
            try {
                lastSavedConfig = await browserApi.storage.get(
                    this.PROXY_CONFIG_STORAGE_KEY,
                ) || null;
            } catch (e) {
                log.error('Error on getting last saved config from storage', e);
            }

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
     * Checks if we need to trigger onAuthRequired event, we added this check
     * because the trigger looks awfully, and we want to do it as less as possible.
     *
     * @param oldConfig Old proxy config.
     * @param newConfig New proxy config.
     *
     * @returns True if we need to trigger onAuthRequired event, false otherwise.
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
            // If the host or credentials changed, we need to clear the proxy credentials cache first
            await ProxyApi.clearProxyHostCredentialsCache(config.host);

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
     * Registers onAuthRequired listener on top level to wake up the service worker
     * and handles authorization for active proxy only
     */
    public init = (): void => {
        this.addOnAuthRequiredListener();
    };
}

const proxyApi = new ProxyApi();

export { proxyApi };
