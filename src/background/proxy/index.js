// !IMPORTANT!
// export './abstractProxyApi' is replaced during webpack compilation
// with NormalModuleReplacementPlugin to proper browser implementation
// from './firefox/proxyApi' or ./chrome/proxyApi
import proxyApi from './abstractProxyApi';

import log from '../../lib/logger';
import storage from '../storage';
import { NON_ROUTABLE_NETS } from '../routability/nonRoutableNets';
import { MESSAGES_TYPES } from '../../lib/constants';
import browserApi from '../browserApi';
import { CONNECTION_MODES, LEVELS_OF_CONTROL } from './proxyConsts';

const CURRENT_ENDPOINT_KEY = 'proxyCurrentEndpoint';

const DEFAULTS = {
    currentEndpoint: '',
    currentHost: '',
};

class ExtensionProxy {
    constructor() {
        this.isActive = false;
        this.currentConfig = this.getConfig();
        this.bypassList = [];
        this.currentAccessPrefix = '';
        this.currentEndpoint = '';
        this.currentHost = '';
    }

    async turnOn() {
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

    async turnOff() {
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
            throw new Error(`Failed to turn off proxy due to error: ${e.message}`);
        }

        log.info('Proxy turned off');
        proxyApi.onProxyError.removeListener(ExtensionProxy.errorHandler);
    }

    async canControlProxy() {
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

    static errorHandler(details) {
        log.error(JSON.stringify(details));
    }

    getConfig() {
        return {
            mode: CONNECTION_MODES.FIXED_SERVERS,
            bypassList: this.getBypassList(),
            host: this.currentHost,
            port: 443,
            scheme: 'https',
            inverted: this.inverted,
        };
    }

    updateConfig() {
        this.currentConfig = this.getConfig();
    }

    async applyConfig() {
        this.updateConfig();
        if (this.isActive) {
            await this.turnOn();
        }
    }

    getBypassList() {
        if (this.bypassList) {
            return [...NON_ROUTABLE_NETS, ...this.bypassList];
        }
        return [...NON_ROUTABLE_NETS];
    }

    setBypassList = async (exclusions = [], inverted = false) => {
        this.bypassList = exclusions;
        this.inverted = inverted;
        await this.applyConfig();
    };

    setHost = async (host) => {
        this.currentHost = host;
        await this.applyConfig();
    };

    setAccessPrefix = async (accessPrefix) => {
        const endpoint = await this.getCurrentEndpoint();
        if (!endpoint) {
            throw new Error('current endpoint is empty');
        }
        const { domainName } = endpoint;
        const host = `${accessPrefix}.${domainName}`;
        this.currentAccessPrefix = accessPrefix;
        this.setHost(host);
        return { host, domainName };
    };

    getHost = () => {
        if (!this.currentHost) {
            return null;
        }
        return this.currentHost;
    };

    getDomainName = async () => {
        const endpoint = await this.getCurrentEndpoint();
        if (!endpoint) {
            return null;
        }
        return endpoint.domainName;
    };

    setCurrentEndpoint = async (endpoint) => {
        this.currentEndpoint = endpoint;
        const { domainName } = this.currentEndpoint;
        const host = `${this.currentAccessPrefix}.${domainName}`;
        this.setHost(host);
        await storage.set(CURRENT_ENDPOINT_KEY, endpoint);
        browserApi.runtime.sendMessage({
            type: MESSAGES_TYPES.CURRENT_ENDPOINT_UPDATED,
            data: endpoint,
        });
        return { host, domainName };
    };

    getCurrentEndpoint = async () => {
        if (!this.currentEndpoint) {
            this.currentEndpoint = await storage.get(CURRENT_ENDPOINT_KEY);
        }
        return this.currentEndpoint ? this.currentEndpoint : null;
    };

    resetSettings = async () => {
        await this.turnOff();
        await storage.remove(CURRENT_ENDPOINT_KEY);
        this.currentHost = DEFAULTS.currentHost;
        this.currentEndpoint = DEFAULTS.currentEndpoint;
    };
}

const proxy = new ExtensionProxy();

export { proxy };

