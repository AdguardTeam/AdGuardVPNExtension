// !IMPORTANT!
// export './abstractProxyApi' is replaced during webpack compilation
// with NormalModuleReplacementPlugin to proper browser implementation
// from './firefox/proxyApi' or ./chrome/proxyApi

import { log } from '../../common/logger';
import { browserApi } from '../browserApi';
import { notifier } from '../../common/notifier';
import { NON_ROUTABLE_CIDR_NETS } from '../routability/constants';
import { fallbackApi } from '../api/fallbackApi';
import {
    type AccessCredentials,
    type CanControlProxy,
    type EndpointInterface,
    type LocationInterface,
    PROXY_DEFAULTS,
    type ProxyConfigInterface,
    StorageKey,
} from '../schema';
import { StateData } from '../stateStorage';

import { DEFAULT_EXCLUSIONS, LEVELS_OF_CONTROL } from './proxyConsts';
import { proxyApi } from './abstractProxyApi';

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
    /**
     * Extension proxy service state data.
     */
    private proxyState = new StateData(StorageKey.ProxyState);

    async init(): Promise<void> {
        const { currentConfig } = await this.proxyState.get();
        if (!currentConfig) {
            await this.updateConfig();
        }
    }

    async turnOn(): Promise<void> {
        const { canControlProxy, cause } = await this.canControlProxy();

        if (!canControlProxy) {
            throw new Error(`Can't set proxy due to: ${cause}`);
        }

        const { currentConfig } = await this.proxyState.get();

        try {
            await proxyApi.proxySet(currentConfig);
            await this.proxyState.update({ isActive: true });
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
            await this.proxyState.update({ isActive: false });
            proxyApi.onProxyError.removeListener(ExtensionProxy.errorHandler);
            log.info(`Proxy cant be controlled due to: ${cause}`);
            log.info('Set state to turned off');
        }

        try {
            await proxyApi.proxyClear();
            await this.proxyState.update({ isActive: false });
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
        const {
            bypassList,
            endpointsTldExclusions,
            currentHost,
            inverted,
            credentials,
        } = await this.proxyState.get();

        return {
            bypassList: bypassList || [],
            defaultExclusions: [
                ...DEFAULT_EXCLUSIONS,
                ...endpointsTldExclusions || PROXY_DEFAULTS.endpointsTldExclusions,
                ...await fallbackApi.getApiUrlsExclusions(),
            ],
            nonRoutableCidrNets: NON_ROUTABLE_CIDR_NETS,
            host: currentHost || PROXY_DEFAULTS.currentHost,
            port: PROXY_CONFIG_PORT,
            scheme: PROXY_CONFIG_SCHEME,
            inverted: inverted || false,
            credentials,
        };
    }

    async updateConfig(): Promise<void> {
        const newConfig = await this.getConfig();
        await this.proxyState.update({ currentConfig: newConfig });
    }

    async applyConfig(): Promise<void> {
        await this.updateConfig();

        const { isActive, currentConfig } = await this.proxyState.get();
        if (isActive) {
            await proxyApi.proxySet(currentConfig);
        }
    }

    setEndpointsTldExclusions = async (endpointsTldExclusions: string[] = []): Promise<void> => {
        await this.proxyState.update({ endpointsTldExclusions });
        await this.applyConfig();
    };

    setBypassList = async (exclusions: string[] = [], inverted = false): Promise<void> => {
        await this.proxyState.update({ bypassList: exclusions, inverted });
        await this.applyConfig();
    };

    setHost = async (domainName: string): Promise<void> => {
        if (!domainName) {
            return;
        }
        await this.proxyState.update({ currentHost: domainName });
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
        await this.proxyState.update({ credentials });
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
        await this.proxyState.update({ currentEndpoint: endpoint });
        const { domainName } = endpoint;
        await this.setHost(domainName);
        await browserApi.storage.set(CURRENT_ENDPOINT_KEY, endpoint);
        // notify popup
        notifier.notifyListeners(notifier.types.CURRENT_LOCATION_UPDATED, location);
        return { domainName };
    };

    getCurrentEndpoint = async (): Promise<EndpointInterface | null> => {
        let { currentEndpoint } = await this.proxyState.get();
        if (!currentEndpoint) {
            currentEndpoint = await browserApi.storage.get(CURRENT_ENDPOINT_KEY) || null;
            await this.proxyState.update({ currentEndpoint });
        }
        return currentEndpoint;
    };

    resetSettings = async (): Promise<void> => {
        await this.turnOff();
        await browserApi.storage.remove(CURRENT_ENDPOINT_KEY);
        await this.proxyState.update({
            currentHost: PROXY_DEFAULTS.currentHost,
            currentEndpoint: PROXY_DEFAULTS.currentEndpoint,
        });
    };
}

export const proxy = new ExtensionProxy();
