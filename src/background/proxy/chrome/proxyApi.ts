import { type ProxyConfigInterface, StorageKey, type AccessCredentials } from '../../schema';
import { StateData } from '../../stateStorage';
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

    /**
     * Global proxy config state data.
     * Used to save and retrieve global proxy config state from session storage,
     * in order to persist it across service worker restarts.
     */
    private globalProxyConfigState = new StateData(StorageKey.GlobalProxyConfig);

    /**
     * Host credentials repository state data.
     * Used to save and retrieve host credentials repository state from session storage,
     * in order to persist it across service worker restarts.
     *
     * This repository is used to track which credentials have been used for which hosts,
     * because Chrome hard-caches credentials per host, and there is no way to identify
     * which credentials have been used for which host, except by tracking it ourselves.
     *
     * NOTE: We use session storage here because host credentials are cached only during the session,
     * so, if the browser is restarted, this repository will be cleared as well.
     */
    private hostCredentialsRepositoryState = new StateData(StorageKey.HostCredentialsRepository);

    /**
     * Saves global proxy config to both session and local storage.
     *
     * @param globalProxyConfig Config to be saved.
     */
    private async saveGlobalProxyConfig(globalProxyConfig: ProxyConfigInterface | null): Promise<void> {
        await this.globalProxyConfigState.set(globalProxyConfig);
        await browserApi.storage.set(this.PROXY_CONFIG_STORAGE_KEY, globalProxyConfig);
    }

    /**
     * Updates credentials for the given host in the repository.
     *
     * @param host Host for which credentials should be updated.
     * @param credentials New credentials to be set for the host.
     */
    private async updateHostCredentials(host: string, credentials: AccessCredentials): Promise<void> {
        const repository = await this.hostCredentialsRepositoryState.get();
        repository[host] = credentials;
        await this.hostCredentialsRepositoryState.set(repository);
    }

    /**
     * Checks if host credentials are changed.
     *
     * @param host Host to check.
     * @param credentials New credentials to compare with existing ones.
     *
     * @returns True if credentials are changed, false otherwise or if there are no existing credentials for the host.
     */
    private async areHostCredentialsChanged(host: string, credentials: AccessCredentials): Promise<boolean> {
        const repository = await this.hostCredentialsRepositoryState.get();
        const currentlyUsedCredentials = repository[host];

        if (!currentlyUsedCredentials) {
            return false;
        }

        return currentlyUsedCredentials.username !== credentials.username
            || currentlyUsedCredentials.password !== credentials.password;
    }

    /**
     * Converts proxyConfig to chromeConfig.
     *
     * @param proxyConfig
     *
     * @returns ChromeConfig version of proxyConfig.
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
     * Clears proxy credentials cache for the given host,
     * and if successful, clears host credentials repository as well.
     *
     * NOTE: This method uses a hack by clearing cookies for the top-level
     * domain of the host, so, reliability of this method is not guaranteed.
     *
     * @see {@link https://developer.chrome.com/docs/extensions/reference/api/browsingData#properties_1}
     * @see {@link https://stackoverflow.com/a/66896099}
     *
     * @param host Host for which proxy credentials cache should be cleared.
     */
    private async clearProxyHostCredentialsCache(host: string): Promise<void> {
        try {
            const topLevelDomain = getETld(host);
            if (!topLevelDomain) {
                log.warn(`[vpn.ProxyApi.clearProxyHostCredentialsCache]: Could not determine top-level domain for host '${host}' while clearing proxy credentials cache`);
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

            /**
             * Because clearing cookies is available only for the top-level domain,
             * it will clear cookies for all subdomains, which means that credentials
             * for all subdomains (locations hosts) are cleared, thus, we should clear
             * our repository as well.
             *
             * Note: We do it only after the clearing operation is done, because we need
             * to ensure that all cookies are cleared before clearing repository.
             */
            await this.hostCredentialsRepositoryState.set({});
        } catch (error) {
            log.error('[vpn.ProxyApi.clearProxyHostCredentialsCache]: Error clearing proxy credentials cache:', error);
        }
    }

    /**
     * Handles onAuthRequired events by providing credentials from the global proxy config
     * if the challenger host matches the proxy host and credentials are set.
     * Also updates host credentials repository after providing credentials.
     *
     * @param details Request details
     * @param callback Callback to be called with credentials or empty object.
     */
    private onAuthRequiredHandler = async (
        details: chrome.webRequest.WebAuthenticationChallengeDetails,
        // callback is optional in chrome.webRequest.onAuthRequired event
        callback?: (response: chrome.webRequest.BlockingResponse) => void,
    ): Promise<void> => {
        log.info('[vpn.ProxyApi]: fired with details:', details);
        if (!callback) {
            log.error('[vpn.ProxyApi]: callback is not defined');
            return;
        }

        const { challenger } = details;

        let globalProxyConfig = await this.globalProxyConfigState.get();

        // This may happen after browser restart, when the extension is not fully loaded yet
        if (!globalProxyConfig) {
            log.info('[vpn.ProxyApi]: globalProxyConfig is not set, wait for the last saved config from storage');
            let lastSavedConfig: ProxyConfigInterface | null = null;
            try {
                lastSavedConfig = await browserApi.storage.get(
                    this.PROXY_CONFIG_STORAGE_KEY,
                ) || null;
            } catch (e) {
                log.error('[vpn.ProxyApi]: Error on getting last saved config from storage', e);
            }

            log.info('[vpn.ProxyApi]: last saved config from storage:', lastSavedConfig);
            globalProxyConfig = lastSavedConfig;
            await this.saveGlobalProxyConfig(globalProxyConfig);
        }

        if (challenger && challenger.host !== globalProxyConfig?.host) {
            log.info(
                `[vpn.ProxyApi]: challenger host: ${challenger.host} is not equal to proxy host: ${globalProxyConfig?.host}`,
            );
            callback({});
            return;
        }

        /**
         * If credentials are set in the global proxy config, use them to authenticate.
         * After providing credentials, update host credentials repository to match
         * the current state of credentials cache in Chrome.
         *
         * Note: We update host credentials repository only after calling the callback,
         * because we need to ensure that credentials are accepted by the proxy server,
         * otherwise, we might end up with miss-match credentials in our repository.
         */
        if (globalProxyConfig?.credentials) {
            log.info('[vpn.ProxyApi]: credentials are set', globalProxyConfig.credentials);
            callback({ authCredentials: globalProxyConfig.credentials });
            await this.updateHostCredentials(globalProxyConfig.host, globalProxyConfig.credentials);
            return;
        }

        log.info('[vpn.ProxyApi]: credentials were not set');
        callback({});
    };

    /**
     * Adds listener for the onAuthRequired event
     */
    private addOnAuthRequiredListener = (): void => {
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
     * Converts provided proxy settings to Chrome ProxyAPI compatible and sets them via chrome.proxy.settings.
     * It is important to note that we set proxy via PAC-script because our exclusions need more complex logic
     * than we can achieve with a fixed_servers option.
     * Also if it's needed, it clears proxy credentials cache for the host if the host or credentials changed.
     *
     * @param newConfig New proxy config to set.
     */
    public proxySet = async (newConfig: ProxyConfigInterface): Promise<void> => {
        // Convert to Chrome config and set it
        const chromeConfig = ProxyApi.convertToChromeConfig(newConfig);
        await promisifiedSetProxy(chromeConfig);

        /**
         * We clear proxy credentials cache only if it was changed,
         * because Chrome caches credentials per host, so, if new credentials
         * differs from the last used one for given host, we need to clear the cache.
         *
         * Note: We need to await here before running the trigger,
         * because we need to ensure that cache is cleared before
         * we try to use new credentials.
         */
        const { host, credentials } = newConfig;
        const areHostCredentialsChanged = await this.areHostCredentialsChanged(host, credentials);
        if (areHostCredentialsChanged) {
            await this.clearProxyHostCredentialsCache(host);
        }

        /**
         * We should trigger `onAuthRequired` event if either
         * host or credentials changed or if we previously
         * cleared the caches, because Chrome might
         * not trigger it automatically in following scenarios:
         * - In chromium browsers prior to version 122
         *   `onAuthRequired` is not triggered for service worker requests
         * - In Opera it is not triggered at all
         * - In Edge it's not triggered for home page requests
         *
         * Note: We do not await for the promise to resolve
         * because we don't want to block the main thread.
         *
         * @see {@link https://issues.chromium.org/issues/40870289}
         */
        const globalProxyConfig = await this.globalProxyConfigState.get();
        if (
            areHostCredentialsChanged
            || this.shouldApplyProxyAuthTrigger(globalProxyConfig, newConfig)
        ) {
            proxyAuthTrigger.run();
        }

        await this.saveGlobalProxyConfig(newConfig);
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
        await this.saveGlobalProxyConfig(null);
    };

    /**
     * Adds proxy error listener, which is called when proxy fails to resolve host
     * Used only for logging purposes
     * @param callback
     */
    public onProxyError = {
        addListener: (cb: ProxyErrorCallback): void => {
            chrome.proxy.onProxyError.addListener(cb);
        },
        removeListener: (cb: ProxyErrorCallback): void => {
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
