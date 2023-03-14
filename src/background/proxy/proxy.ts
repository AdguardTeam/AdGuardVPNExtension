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
import { LocationInterface } from '../endpoints/Location';
import { EndpointInterface } from '../endpoints/Endpoint';
import { extensionState } from '../extensionState';

const CURRENT_ENDPOINT_KEY = 'proxyCurrentEndpoint';

const PROXY_CONFIG_PORT = 443;
const PROXY_CONFIG_SCHEME = 'https';

export interface AccessCredentials {
    username: string,
    password: string,
}

export interface CanControlProxy {
    canControlProxy: boolean;
    cause?: string;
}

export interface ProxyConfigInterface {
    bypassList: string[];
    defaultExclusions: string[];
    nonRoutableCidrNets: string[];
    host: string;
    port: number;
    scheme: string;
    inverted: boolean;
    credentials: AccessCredentials,
}

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
        if (!extensionState.currentState.proxyState.currentConfig) {
            await this.updateConfig();
        }
    }

    async turnOn(): Promise<void> {
        const { canControlProxy, cause } = await this.canControlProxy();
        const { currentConfig } = extensionState.currentState.proxyState;

        if (!canControlProxy) {
            throw new Error(`Can't set proxy due to: ${cause}`);
        }

        try {
            await proxyApi.proxySet(currentConfig);
            await extensionState.setIsProxyActive(true);
        } catch (e) {
            throw new Error(`Failed to turn on proxy with config: ${JSON.stringify(currentConfig)} because of error, ${e.message}`);
        }

        log.info('Proxy turned on');
        proxyApi.onProxyError.addListener(ExtensionProxy.errorHandler);
    }

    async turnOff(): Promise<void> {
        const { canControlProxy, cause } = await this.canControlProxy();

        if (!canControlProxy) {
            // set state to turned off
            await extensionState.setIsProxyActive(false);
            proxyApi.onProxyError.removeListener(ExtensionProxy.errorHandler);
            log.info(`Proxy cant be controlled due to: ${cause}`);
            log.info('Set state to turned off');
        }

        try {
            await proxyApi.proxyClear();
            await extensionState.setIsProxyActive(false);
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
        const { proxyState } = extensionState.currentState;
        const bypassList = proxyState.bypassList || [];
        const inverted = proxyState.inverted || false;
        const currentHost = proxyState.currentHost || '';
        const endpointsTldExclusions = proxyState.endpointsTldExclusions || [];
        const credentials = proxyState.credentials!;

        return {
            bypassList,
            defaultExclusions: [
                ...DEFAULT_EXCLUSIONS,
                ...endpointsTldExclusions,
                ...await fallbackApi.getApiUrlsExclusions(), // FIXME: persist
            ],
            nonRoutableCidrNets: NON_ROUTABLE_CIDR_NETS,
            host: currentHost,
            port: PROXY_CONFIG_PORT,
            scheme: PROXY_CONFIG_SCHEME,
            inverted,
            credentials,
        };
    }

    async updateConfig(): Promise<void> {
        const currentConfig = await this.getConfig();
        await extensionState.updateProxyConfig(currentConfig);
    }

    async applyConfig(): Promise<void> {
        await this.updateConfig();
        const { proxyState } = extensionState.currentState;
        if (proxyState.isActive) {
            await proxyApi.proxySet(proxyState.currentConfig);
        }
    }

    setEndpointsTldExclusions = async (endpointsTldExclusions: string[] = []): Promise<void> => {
        await extensionState.updateEndpointsTldExclusions(endpointsTldExclusions);
        await this.applyConfig();
    };

    setBypassList = async (exclusions: string[] = [], inverted = false): Promise<void> => {
        await extensionState.updateBypassList(exclusions);
        await extensionState.updateInverted(inverted);
        await this.applyConfig();
    };

    setHost = async (domainName: string): Promise<void> => {
        if (!domainName) {
            return;
        }
        await extensionState.updateCurrentHost(domainName);
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
        await extensionState.updateProxyCredentials(credentials);
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
        await extensionState.updateCurrentEndpoint(endpoint);
        const { domainName } = endpoint;
        await this.setHost(domainName);
        await browserApi.storage.set(CURRENT_ENDPOINT_KEY, endpoint);
        // notify popup
        notifier.notifyListeners(notifier.types.CURRENT_LOCATION_UPDATED, location);
        return { domainName };
    };

    getCurrentEndpoint = async (): Promise<EndpointInterface | null> => {
        let { currentEndpoint } = extensionState.currentState.proxyState;
        if (!currentEndpoint) {
            currentEndpoint = await browserApi.storage.get(CURRENT_ENDPOINT_KEY);
        }
        return currentEndpoint || null;
    };

    resetSettings = async (): Promise<void> => {
        await this.turnOff();
        await browserApi.storage.remove(CURRENT_ENDPOINT_KEY);
        await extensionState.resetCurrentHost();
        await extensionState.resetCurrentEndpoint();
    };
}

export const proxy = new ExtensionProxy();
