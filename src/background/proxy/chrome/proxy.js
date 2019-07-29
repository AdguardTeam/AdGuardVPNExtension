import browser from 'webextension-polyfill';
import log from '../../../lib/logger';

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

class Proxy {
    constructor() {
        this.moscowConfig = {
            mode: 'fixed_servers',
            rules: {
                bypassList: BYPASS_LIST,
                singleProxy: {
                    scheme: 'https',
                    host: 'local.msk2.ru.adguard.io',
                    port: 443,
                },
            },
        };
        this.systemConfig = {
            mode: 'system',
        };
    }

    async turnOn() {
        const { canControlProxy, cause } = await this.canControlProxy();

        if (!canControlProxy) {
            throw new Error(`Can't set proxy due to: ${cause}`);
        }

        try {
            await proxySetAsync({ value: this.moscowConfig, scope: 'regular' });
        } catch (e) {
            throw new Error(`Unable to turn on proxy because of error, ${e.message}`);
        }

        log.info('Proxy turned on');
        browser.proxy.onProxyError.addListener(Proxy.errorHandler);
    }

    async turnOff() {
        const { canControlProxy, cause } = await this.canControlProxy();

        if (!canControlProxy) {
            throw new Error(`Can't set proxy due to: ${cause}`);
        }

        try {
            await proxySetAsync({ value: this.systemConfig, scope: 'regular' });
        } catch (e) {
            throw new Error(`Failed to turn off proxy due to error: ${e.message}`);
        }

        log.info('Proxy turned off');
        browser.proxy.onProxyError.removeListener(Proxy.errorHandler);
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
}

export const proxy = new Proxy();
