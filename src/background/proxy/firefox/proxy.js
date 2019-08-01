import browser from 'webextension-polyfill';
import log from '../../../lib/logger';

// TODO [maximtop] complete this list with values from https://tools.ietf.org/html/rfc3330
const BYPASS_LIST = [
    '10.0.0.0/8',
    '127.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '::1/128',
    'localhost',
    '*.local',
    'adguard.com',
    'performix.ru',
];

const proxyGetAsync = (config = {}) => browser.proxy.settings.get(config);

const proxySetAsync = (config = {}) => browser.proxy.settings.set(config);

const checkProxyStatus = async () => {
    const { levelOfControl } = await proxyGetAsync();
    switch (levelOfControl) {
        case 'not_controllable':
        case 'controlled_by_other_extensions': {
            return { canControlProxy: false, cause: levelOfControl };
        }
        default:
            return { canControlProxy: true };
    }
};

class ExtensionProxy {
    constructor() {
        this.currentConfig = {
            proxyType: 'manual',
            ssl: 'https://local.msk2.ru.adguard.io:443',
        };
        this.systemConfig = {
            proxyType: 'system',
        };
    }

    async turnOn() {
        const status = await checkProxyStatus();
        const { canSetProxy, cause } = status;

        if (!canSetProxy) {
            log.warn(`Can't set proxy due to: ${cause}`);
            return;
        }

        try {
            await proxySetAsync({ value: this.moscowConfig });
        } catch (e) {
            log.error(`Unable to turn on proxy because of error, ${e.message}`);
        }

        log.info('Proxy turned on');
        browser.proxy.onError.addListener(ExtensionProxy.errorHandler);
    }

    async turnOff() {
        const { canSetProxy, cause } = await checkProxyStatus();

        if (!canSetProxy) {
            log.warn(`Can't set proxy due to: ${cause}`);
            return;
        }

        try {
            await proxySetAsync({ value: this.systemConfig });
        } catch (e) {
            log.error(`Failed to turn off proxy due to error: ${e.message}`);
        }

        log.info('Proxy turned off');
        browser.proxy.onError.removeListener(ExtensionProxy.errorHandler);
    }

    static errorHandler(details) {
        log.error(JSON.stringify(details));
    }
}

export const proxy = new ExtensionProxy();
