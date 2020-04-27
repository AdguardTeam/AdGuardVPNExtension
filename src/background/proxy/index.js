// !IMPORTANT!
// export './abstractProxyApi' is replaced during webpack compilation
// with NormalModuleReplacementPlugin to proper browser implementation
// from './firefox/proxyApi' or ./chrome/proxyApi
import proxyApi from './abstractProxyApi';

import log from '../../lib/logger';
import { MESSAGES_TYPES } from '../../lib/constants';
import browserApi from '../browserApi';
import { DEFAULT_EXCLUSIONS, LEVELS_OF_CONTROL } from './proxyConsts';
import notifier from '../../lib/notifier';

const CURRENT_ENDPOINT_KEY = 'proxyCurrentEndpoint';

const DEFAULTS = {
    currentEndpoint: '',
    currentHost: '',
};

const PROXY_AUTH_TYPES = {
    PREFIX: 'prefix',
    AUTH_HANDLER: 'authHandler'
}

class ExtensionProxy {
    constructor() {
        this.isActive = false;
        this.currentConfig = this.getConfig();
        this.bypassList = [];
        this.currentEndpoint = '';
        this.currentHost = '';

        /**
         * By default we use PREFIX type, because AUTH_HANDLER is not working stable
         */
        this.proxyAuthorizationType = PROXY_AUTH_TYPES.PREFIX;
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
        log.debug(JSON.stringify(details));
    }

    getConfig() {
        return {
            bypassList: this.getBypassList(),
            defaultExclusions: DEFAULT_EXCLUSIONS,
            host: this.currentHost,
            port: 443,
            scheme: 'https',
            inverted: this.inverted,
            credentials: this.credentials,
        };
    }

    updateConfig() {
        this.currentConfig = this.getConfig();
    }

    async applyConfig() {
        this.updateConfig();
        if (this.isActive) {
            await proxyApi.proxySet(this.currentConfig);
        }
    }

    getBypassList() {
        if (this.bypassList) {
            return [...this.bypassList];
        }
        return [];
    }

    setBypassList = async (exclusions = [], inverted = false) => {
        this.bypassList = exclusions;
        this.inverted = inverted;
        await this.applyConfig();
    };

    setHost = async (prefix, domainName) => {
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

    setAccessPrefix = async (prefix, credentials) => {
        const endpoint = await this.getCurrentEndpoint();
        if (!endpoint) {
            throw new Error('current endpoint is empty');
        }
        const { domainName } = endpoint;
        this.credentials = credentials;
        await this.setHost(prefix, domainName);
        return { domainName };
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
        await this.setHost(this.currentPrefix, domainName);
        await browserApi.storage.set(CURRENT_ENDPOINT_KEY, endpoint);
        // notify popup
        notifier.notifyListeners(notifier.types.CURRENT_ENDPOINT_UPDATED, endpoint);
        return { domainName };
    };

    getCurrentEndpoint = async () => {
        if (!this.currentEndpoint) {
            this.currentEndpoint = await browserApi.storage.get(CURRENT_ENDPOINT_KEY);
        }
        return this.currentEndpoint ? this.currentEndpoint : null;
    };

    resetSettings = async () => {
        await this.turnOff();
        await browserApi.storage.remove(CURRENT_ENDPOINT_KEY);
        this.currentHost = DEFAULTS.currentHost;
        this.currentEndpoint = DEFAULTS.currentEndpoint;
    };
}

const proxy = new ExtensionProxy();

export default proxy;

