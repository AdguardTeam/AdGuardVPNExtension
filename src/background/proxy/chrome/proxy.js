import browser from 'webextension-polyfill';
import log from '../../../lib/logger';
import storage from '../../storage';
import { NON_ROUTABLE_NETS } from '../../ip';

const CURRENT_ENDPOINT_KEY = 'proxyCurrentEndpoint';

const proxyGetAsync = (config = {}) => new Promise((resolve) => {
    browser.proxy.settings.get(config, (details) => {
        resolve(details);
    });
});

const proxySetAsync = config => new Promise((resolve) => {
    browser.proxy.settings.set(config, () => {
        resolve();
    });
});

const DEFAULTS = {
    currentEndpoint: '',
    currentHost: '',
};

class ExtensionProxy {
    constructor() {
        this.isActive = false;
        this.currentConfig = this.getConfig();
        this.systemConfig = {
            mode: 'system',
        };

        this.bypassWhitelist = [];

        this.currentEndpoint = '';

        this.currentHost = '';
    }

    async turnOn() {
        const { canControlProxy, cause } = await this.canControlProxy();

        if (!canControlProxy) {
            throw new Error(`Can't set proxy due to: ${cause}`);
        }

        try {
            await proxySetAsync({ value: this.currentConfig, scope: 'regular' });
            this.isActive = true;
        } catch (e) {
            throw new Error(`Failed to turn on proxy with config: ${JSON.stringify(this.currentConfig)} because of error, ${e.message}`);
        }

        log.info('Proxy turned on');
        browser.proxy.onProxyError.addListener(ExtensionProxy.errorHandler);
    }

    async turnOff() {
        const { canControlProxy, cause } = await this.canControlProxy();

        if (!canControlProxy) {
            // set state to turned off
            this.isActive = false;
            browser.proxy.onProxyError.removeListener(ExtensionProxy.errorHandler);
            log.info(`Proxy cant be controlled due to: ${cause}`);
            log.info('Set state to turned off');
        }

        try {
            await proxySetAsync({ value: this.systemConfig, scope: 'regular' });
            this.isActive = false;
        } catch (e) {
            throw new Error(`Failed to turn off proxy due to error: ${e.message}`);
        }

        log.info('Proxy turned off');
        browser.proxy.onProxyError.removeListener(ExtensionProxy.errorHandler);
    }

    async canControlProxy() {
        const { levelOfControl } = await proxyGetAsync();
        switch (levelOfControl) {
            case 'not_controllable':
            case 'controlled_by_other_extensions': {
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
        const bypassList = this.getBypassList();

        const proxy = {
            scheme: 'https',
            host: this.currentHost,
            port: 443,
        };

        return {
            mode: 'fixed_servers',
            rules: {
                bypassList,
                singleProxy: proxy,
            },
        };
    }

    updateConfig() {
        this.currentConfig = this.getConfig();
    }

    async restartProxy() {
        this.updateConfig();
        if (this.isActive) {
            await this.turnOn();
        } else {
            await this.turnOff();
        }
    }

    getBypassList() {
        if (this.bypassWhitelist) {
            return [...NON_ROUTABLE_NETS, ...this.bypassWhitelist];
        }
        return [...NON_ROUTABLE_NETS];
    }

    async setBypassWhitelist(whitelist) {
        this.bypassWhitelist = whitelist;
        await this.restartProxy();
    }

    setHost = (host) => {
        this.currentHost = host;
        this.updateConfig();
    };

    updateCurrentHost = async (domainPrefix) => {
        const endpoint = await this.getCurrentEndpoint();
        const { domainName } = endpoint;
        const host = `${domainPrefix}.${domainName}`;
        this.setHost(host);
        return host;
    };

    setCurrentEndpoint = async (endpoint) => {
        this.currentEndpoint = endpoint;
        return storage.set(CURRENT_ENDPOINT_KEY, endpoint);
    };

    getCurrentEndpoint = async () => {
        let result = this.currentEndpoint;
        if (!result) {
            result = await storage.get(CURRENT_ENDPOINT_KEY);
            this.currentEndpoint = result;
        }
        return result;
    };

    resetSettings = async () => {
        await this.turnOff();
        await storage.remove(CURRENT_ENDPOINT_KEY);
        this.currentHost = DEFAULTS.currentHost;
        this.currentEndpoint = DEFAULTS.currentEndpoint;
    }
}

const proxy = new ExtensionProxy();

export { proxy };
