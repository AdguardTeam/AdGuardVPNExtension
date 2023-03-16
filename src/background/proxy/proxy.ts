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
import { type EndpointInterface } from '../endpoints/schema';
import { session } from '../sessionStorage';
import {
    type ProxyConfigInterface,
    type CanControlProxy,
    PROXY_DEFAULTS,
} from './schema';

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
        return <boolean>session.currentState.proxyState.isActive;
    }

    set isActive(isActive: boolean) {
        // session.updateState({
        //     proxyState: {
        //         isActive,
        //     },
        // });

        
    }

    get currentConfig() {
        return <ProxyConfigInterface>session.currentState.proxyState.currentConfig;
    }

    set currentConfig(currentConfig: ProxyConfigInterface) {
        session.updateState({
            proxyState: {
                currentConfig,
            },
        });
    }

    get bypassList() {
        return <string[]>session.currentState.proxyState.bypassList;
    }

    set bypassList(bypassList: string[]) {
        session.updateState({
            proxyState: {
                bypassList,
            },
        });
    }

    get inverted() {
        return <boolean>session.currentState.proxyState.inverted;
    }

    set inverted(inverted: boolean) {
        session.updateState({
            proxyState: {
                inverted,
            },
        });
    }

    get endpointsTldExclusions() {
        return <string[]>session.currentState.proxyState.endpointsTldExclusions;
    }

    set endpointsTldExclusions(endpointsTldExclusions: string[]) {
        session.updateState({
            proxyState: {
                endpointsTldExclusions,
            },
        });
    }

    get currentEndpoint() {
        return <EndpointInterface | null>session.currentState.proxyState.currentEndpoint;
    }

    set currentEndpoint(currentEndpoint: EndpointInterface | null) {
        session.updateState({
            proxyState: {
                currentEndpoint,
            },
        });
    }

    get currentHost() {
        return <string>session.currentState.proxyState.currentHost;
    }

    set currentHost(currentHost: string) {
        session.updateState({
            proxyState: {
                currentHost,
            },
        });
    }

    get credentials() {
        return <AccessCredentials>session.currentState.proxyState.credentials;
    }

    set credentials(credentials: AccessCredentials) {
        session.updateState({
            proxyState: {
                credentials,
            },
        });
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
