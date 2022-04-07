// !IMPORTANT!
// export './abstractProxyApi' is replaced during webpack compilation
// with NormalModuleReplacementPlugin to proper browser implementation
// from './firefox/proxyApi' or ./chrome/proxyApi
import proxyApi from './abstractProxyApi';

import { log } from '../../lib/logger';
import browserApi from '../browserApi';
import notifier from '../../lib/notifier';
import { DEFAULT_EXCLUSIONS, LEVELS_OF_CONTROL } from './proxyConsts';
import { NON_ROUTABLE_CIDR_NETS } from '../routability/constants';
import { fallbackApi } from '../api/fallbackApi';
import { LocationInterface } from '../endpoints/Location';
import { EndpointInterface } from '../endpoints/Endpoint';

const CURRENT_ENDPOINT_KEY = 'proxyCurrentEndpoint';

const DEFAULTS = {
    currentEndpoint: null,
    currentHost: null,
};

const PROXY_AUTH_TYPES = {
    PREFIX: 'prefix',
    AUTH_HANDLER: 'authHandler',
};

interface AccessCredentials {
    username: string,
    password: string,
}

interface CanControlProxy {
    canControlProxy: boolean;
    cause?: boolean;
}

interface ConfigData {
    bypassList: string[];
    defaultExclusions: string[];
    nonRoutableCidrNets: string[];
    host: string | null;
    port: number;
    scheme: string;
    inverted: boolean;
    credentials: AccessCredentials,
}

export interface ExtensionProxyInterface {
    isActive: boolean;
    bypassList: string[];
    endpointsTldExclusions: any[];
    currentEndpoint: EndpointInterface | null;
    currentHost: string | null;
    proxyAuthorizationType: string;
    currentConfig: ConfigData;
    inverted: boolean;
    credentials: AccessCredentials;
    currentPrefix: string;

    init(): Promise<void>;
    turnOn(): Promise<void>;
    turnOff(): Promise<void>;
    canControlProxy(): Promise<CanControlProxy>
    getConfig(): Promise<ConfigData>;
    updateConfig(): Promise<void>;
    applyConfig(): Promise<void>;
    // TODO rewrite endpointTldExclusions.js to ts anr remove any
    getEndpointsTldExclusions(): any;
    setEndpointsTldExclusions(endpointsTldExclusions: any): Promise<void>;
    getBypassList(): string[];
    setBypassList(exclusions: string[], inverted: boolean): Promise<void>;
    setHost(prefix: string, domainName: string): Promise<void>;
    setAccessPrefix(
        credentialsHash: string,
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
    getCurrentEndpoint(): Promise<EndpointInterface | null>;
    resetSettings(): Promise<void>;
}

class ExtensionProxy implements ExtensionProxyInterface {
    isActive: boolean;

    bypassList: string[];

    endpointsTldExclusions: any[];

    currentEndpoint: EndpointInterface | null;

    currentHost: string | null;

    proxyAuthorizationType: string;

    currentConfig: ConfigData;

    inverted: boolean;

    credentials: AccessCredentials;

    currentPrefix: string;

    constructor() {
        this.isActive = false;
        this.bypassList = [];
        this.endpointsTldExclusions = [];
        this.currentEndpoint = DEFAULTS.currentEndpoint;
        this.currentHost = DEFAULTS.currentHost;

        /**
         * By default we use PREFIX type, because AUTH_HANDLER is not working stable
         */
        this.proxyAuthorizationType = PROXY_AUTH_TYPES.PREFIX;
    }

    async init(): Promise<void> {
        this.currentConfig = await this.getConfig();
    }

    async turnOn(): Promise<void> {
        const { canControlProxy, cause } = await this.canControlProxy();

        if (!canControlProxy) {
            throw new Error(`Can't set proxy due to: ${cause}`);
        }

        try {
            await proxyApi.proxySet(this.currentConfig);
            this.isActive = true;
        } catch (e: any) {
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
        } catch (e: any) {
            log.error(`Failed to turn off proxy due to error: ${e.message}`);
        }

        log.info('Proxy turned off');
        proxyApi.onProxyError.removeListener(ExtensionProxy.errorHandler);
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

    async getConfig(): Promise<ConfigData> {
        return {
            bypassList: this.getBypassList(),
            defaultExclusions: [
                ...DEFAULT_EXCLUSIONS,
                ...this.getEndpointsTldExclusions(),
                ...await fallbackApi.getApiUrlsExclusions(),
            ],
            nonRoutableCidrNets: NON_ROUTABLE_CIDR_NETS,
            host: this.currentHost,
            port: 443,
            scheme: 'https',
            inverted: this.inverted,
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

    getEndpointsTldExclusions = () => {
        if (this.endpointsTldExclusions) {
            return [...this.endpointsTldExclusions];
        }
        return [];
    };

    setEndpointsTldExclusions = async (endpointsTldExclusions = []): Promise<void> => {
        this.endpointsTldExclusions = endpointsTldExclusions;
        await this.applyConfig();
    };

    getBypassList(): string[] {
        if (this.bypassList) {
            return [...this.bypassList];
        }
        return [];
    }

    setBypassList = async (exclusions: string[] = [], inverted = false): Promise<void> => {
        this.bypassList = exclusions;
        this.inverted = inverted;
        await this.applyConfig();
    };

    setHost = async (prefix: string, domainName: string): Promise<void> => {
        if (!prefix || !domainName) {
            return;
        }
        if (this.proxyAuthorizationType === PROXY_AUTH_TYPES.PREFIX) {
            this.currentHost = `${prefix}.${domainName}`;
        } else if (this.proxyAuthorizationType === PROXY_AUTH_TYPES.AUTH_HANDLER) {
            this.currentHost = domainName;
        } else {
            throw new Error(`Wrong proxyAuthorizationType: ${this.proxyAuthorizationType}`);
        }
        this.currentPrefix = prefix;
        await this.applyConfig();
    };

    setAccessPrefix = async (
        prefix: string,
        credentials: AccessCredentials,
    ): Promise<{ domainName: string }> => {
        const endpoint = await this.getCurrentEndpoint();
        if (!endpoint) {
            throw new Error('current endpoint is empty');
        }
        const { domainName } = endpoint;
        this.credentials = credentials;
        await this.setHost(prefix, domainName);
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
        const { domainName } = this.currentEndpoint;
        await this.setHost(this.currentPrefix, domainName);
        await browserApi.storage.set(CURRENT_ENDPOINT_KEY, endpoint);
        // notify popup
        notifier.notifyListeners(notifier.types.CURRENT_LOCATION_UPDATED, location);
        return { domainName };
    };

    getCurrentEndpoint = async (): Promise<EndpointInterface | null> => {
        if (!this.currentEndpoint) {
            this.currentEndpoint = await browserApi.storage.get(CURRENT_ENDPOINT_KEY);
        }
        return this.currentEndpoint ? this.currentEndpoint : null;
    };

    resetSettings = async (): Promise<void> => {
        await this.turnOff();
        await browserApi.storage.remove(CURRENT_ENDPOINT_KEY);
        this.currentHost = DEFAULTS.currentHost;
        this.currentEndpoint = DEFAULTS.currentEndpoint;
    };
}

export const proxy = new ExtensionProxy();
