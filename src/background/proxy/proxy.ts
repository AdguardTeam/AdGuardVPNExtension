// !IMPORTANT!
// export './abstractProxyApi' is replaced during webpack compilation
// with NormalModuleReplacementPlugin to proper browser implementation
// from './firefox/proxyApi' or ./chrome/proxyApi
import proxyApi from './abstractProxyApi';

import { log } from '../../lib/logger';
import { browserApi } from '../browserApi';
import { notifier } from '../../lib/notifier';
import { DEFAULT_EXCLUSIONS, LEVELS_OF_CONTROL } from './proxyConsts';
import { NON_ROUTABLE_CIDR_NETS } from '../routability/constants';
import { fallbackApi } from '../api/fallbackApi';
import type { LocationInterface } from '../endpoints/Location';
import type { EndpointInterface } from '../schema';
import { sessionState } from '../sessionStorage';
import {
    ProxyConfigInterface,
    CanControlProxy,
    AccessCredentials,
    PROXY_DEFAULTS,
    StorageKey,
} from '../schema';

const CURRENT_ENDPOINT_KEY = 'proxyCurrentEndpoint';

const PROXY_CONFIG_PORT = 443;
const PROXY_CONFIG_SCHEME = 'https';

export interface ExtensionProxyInterface {
    init(proxyConfig: ProxyConfigInterface): Promise<void>;
    turnOn(): Promise<void>;
    turnOff(): Promise<void>;
    canControlProxy(): Promise<CanControlProxy>
    setEndpointsTldExclusions(endpointsTldExclusions: string[]): Promise<void>;
    setBypassList(exclusions: string[], inverted: boolean): Promise<void>;
    setAccessCredentials(
        credentials: {
            password: string,
            username: string | null,
        },
    ): Promise<{ domainName: string }>;
    getDomainName(): Promise<string | null>;
    setCurrentEndpoint(
        endpoint: EndpointInterface,
        location: LocationInterface,
    ): Promise<{ domainName: string }>;
    resetSettings(): Promise<void>;
}

class ExtensionProxy implements ExtensionProxyInterface {
    async init(): Promise<void> {
        if (!this.currentConfig) {
            await this.updateConfig();
        }
    }

    get isActive() {
        return sessionState.getItem(StorageKey.ProxyState).isActive;
    }

    set isActive(isActive: boolean) {
        const proxyState = sessionState.getItem(StorageKey.ProxyState);
        proxyState.isActive = isActive;
        sessionState.setItem(StorageKey.ProxyState, proxyState);
    }

    get currentConfig() {
        return sessionState.getItem(StorageKey.ProxyState).currentConfig;
    }

    set currentConfig(currentConfig: ProxyConfigInterface) {
        const proxyState = sessionState.getItem(StorageKey.ProxyState);
        proxyState.currentConfig = currentConfig;
        sessionState.setItem(StorageKey.ProxyState, proxyState);
    }

    get bypassList() {
        return sessionState.getItem(StorageKey.ProxyState).bypassList;
    }

    set bypassList(bypassList: string[]) {
        const proxyState = sessionState.getItem(StorageKey.ProxyState);
        proxyState.bypassList = bypassList;
        sessionState.setItem(StorageKey.ProxyState, proxyState);
    }

    get inverted() {
        return sessionState.getItem(StorageKey.ProxyState).inverted;
    }

    set inverted(inverted: boolean) {
        const proxyState = sessionState.getItem(StorageKey.ProxyState);
        proxyState.inverted = inverted;
        sessionState.setItem(StorageKey.ProxyState, proxyState);
    }

    get endpointsTldExclusions() {
        return sessionState.getItem(StorageKey.ProxyState).endpointsTldExclusions;
    }

    set endpointsTldExclusions(endpointsTldExclusions: string[]) {
        const proxyState = sessionState.getItem(StorageKey.ProxyState);
        proxyState.endpointsTldExclusions = endpointsTldExclusions;
        sessionState.setItem(StorageKey.ProxyState, proxyState);
    }

    get currentEndpoint() {
        return sessionState.getItem(StorageKey.ProxyState).currentEndpoint;
    }

    set currentEndpoint(currentEndpoint: EndpointInterface | null) {
        const proxyState = sessionState.getItem(StorageKey.ProxyState);
        proxyState.currentEndpoint = currentEndpoint;
        sessionState.setItem(StorageKey.ProxyState, proxyState);
    }

    get currentHost() {
        return sessionState.getItem(StorageKey.ProxyState).currentHost;
    }

    set currentHost(currentHost: string) {
        const proxyState = sessionState.getItem(StorageKey.ProxyState);
        proxyState.currentHost = currentHost;
        sessionState.setItem(StorageKey.ProxyState, proxyState);
    }

    get credentials() {
        return sessionState.getItem(StorageKey.ProxyState).credentials;
    }

    set credentials(credentials: AccessCredentials) {
        const proxyState = sessionState.getItem(StorageKey.ProxyState);
        proxyState.credentials = credentials;
        sessionState.setItem(StorageKey.ProxyState, proxyState);
    }

    async turnOn(): Promise<void> {
        const { canControlProxy, cause } = await this.canControlProxy();

        if (!canControlProxy) {
            throw new Error(`Can't set proxy due to: ${cause}`);
        }

        try {
            await proxyApi.proxySet(this.currentConfig);
            this.isActive = true;
        } catch (e) {
            throw new Error(`Failed to turn on proxy with config: ${JSON.stringify(this.currentConfig)} because of error, ${e.message}`);
        }

        log.info('Proxy turned on');
        proxyApi.onProxyError.addListener(ExtensionProxy.errorHandler);
    }

    async turnOff(): Promise<void> {
        const { canControlProxy, cause } = await this.canControlProxy();

        if (!canControlProxy) {
            // set state to turned off
            this.isActive = false;
            proxyApi.onProxyError.removeListener(ExtensionProxy.errorHandler);
            log.info(`Proxy cant be controlled due to: ${cause}`);
            log.info('Set state to turned off');
        }

        try {
            await proxyApi.proxyClear();
            this.isActive = false;
        } catch (e) {
            log.error(`Failed to turn off proxy due to error: ${e.message}`);
        }

        proxyApi.onProxyError.removeListener(ExtensionProxy.errorHandler);
        log.info('Proxy turned off');
    }

    async canControlProxy(): Promise<CanControlProxy> {
        const { levelOfControl } = await proxyApi.proxyGet();
        switch (levelOfControl) {
            case LEVELS_OF_CONTROL.NOT_CONTROLLABLE:
            case LEVELS_OF_CONTROL.CONTROLLED_BY_OTHER_EXTENSION: {
                return { canControlProxy: false, cause: levelOfControl };
            }
            default:
                return { canControlProxy: true };
        }
    }

    static errorHandler(details: any): void {
        log.debug(JSON.stringify(details));
    }

    async getConfig(): Promise<ProxyConfigInterface> {
        return {
            bypassList: this.bypassList || [],
            defaultExclusions: [
                ...DEFAULT_EXCLUSIONS,
                ...this.endpointsTldExclusions || PROXY_DEFAULTS.endpointsTldExclusions,
                ...await fallbackApi.getApiUrlsExclusions(),
            ],
            nonRoutableCidrNets: NON_ROUTABLE_CIDR_NETS,
            host: this.currentHost || PROXY_DEFAULTS.currentHost,
            port: PROXY_CONFIG_PORT,
            scheme: PROXY_CONFIG_SCHEME,
            inverted: this.inverted || false,
            credentials: this.credentials,
        };
    }

    async updateConfig(): Promise<void> {
        this.currentConfig = await this.getConfig();
    }

    async applyConfig(): Promise<void> {
        await this.updateConfig();
        if (this.isActive) {
            await proxyApi.proxySet(this.currentConfig);
        }
    }

    setEndpointsTldExclusions = async (endpointsTldExclusions: string[] = []): Promise<void> => {
        this.endpointsTldExclusions = endpointsTldExclusions;
        await this.applyConfig();
    };

    setBypassList = async (exclusions: string[] = [], inverted = false): Promise<void> => {
        this.bypassList = exclusions;
        this.inverted = inverted;
        await this.applyConfig();
    };

    setHost = async (domainName: string): Promise<void> => {
        if (!domainName) {
            return;
        }
        this.currentHost = domainName;
        await this.applyConfig();
    };

    setAccessCredentials = async (
        credentials: AccessCredentials,
    ): Promise<{ domainName: string }> => {
        const endpoint = await this.getCurrentEndpoint();
        if (!endpoint) {
            throw new Error('current endpoint is empty');
        }
        const { domainName } = endpoint;
        this.credentials = credentials;
        await this.setHost(domainName);
        return { domainName };
    };

    getDomainName = async (): Promise<string | null> => {
        const endpoint = await this.getCurrentEndpoint();
        if (!endpoint) {
            return null;
        }
        return endpoint.domainName;
    };

    setCurrentEndpoint = async (
        endpoint: EndpointInterface,
        location: LocationInterface,
    ): Promise<{ domainName: string }> => {
        this.currentEndpoint = endpoint;
        const { domainName } = endpoint;
        await this.setHost(domainName);
        await browserApi.storage.set(CURRENT_ENDPOINT_KEY, endpoint);
        // notify popup
        notifier.notifyListeners(notifier.types.CURRENT_LOCATION_UPDATED, location);
        return { domainName };
    };

    getCurrentEndpoint = async (): Promise<EndpointInterface | null> => {
        if (!this.currentEndpoint) {
            this.currentEndpoint = await browserApi.storage.get(CURRENT_ENDPOINT_KEY);
        }
        return this.currentEndpoint || null;
    };

    resetSettings = async (): Promise<void> => {
        await this.turnOff();
        await browserApi.storage.remove(CURRENT_ENDPOINT_KEY);
        this.currentHost = PROXY_DEFAULTS.currentHost;
        this.currentEndpoint = PROXY_DEFAULTS.currentEndpoint;
    };
}

export const proxy = new ExtensionProxy();
