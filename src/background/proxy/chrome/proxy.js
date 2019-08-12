import browser from 'webextension-polyfill';
import log from '../../../lib/logger';
import storage from '../../storage';

// TODO complete this list with values from https://tools.ietf.org/html/rfc3330
const BYPASS_LIST = [
    '10.0.0.0/8',
    '127.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '::1/128',
    'localhost',
    '*.local',
    'bit.adguard.com',
];

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

class ExtensionProxy {
    constructor() {
        this.isActive = false;
        this.currentConfig = this.getConfig();
        this.systemConfig = {
            mode: 'system',
        };

        this.bypassWhitelist = [];
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
            throw new Error(`Can't set proxy due to: ${cause}`);
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
            host: 'local.msk2.ru.adguard.io',
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
            return [...BYPASS_LIST, ...this.bypassWhitelist];
        }
        return [...BYPASS_LIST];
    }

    async setBypassWhitelist(whitelist) {
        this.bypassWhitelist = whitelist;
        await this.restartProxy();
    }

    setCurrentEndpoint = async (endpoint) => {
        return storage.set(CURRENT_ENDPOINT_KEY, endpoint);
    };

    getCurrentEndpoint = async () => {
        return storage.get(CURRENT_ENDPOINT_KEY);
    };
}

const proxy = new ExtensionProxy();
// eslint-disable-next-line import/prefer-default-export
export { proxy };
