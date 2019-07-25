import browser from 'webextension-polyfill';
import log from '../lib/logger';

const errorHandler = (details) => {
    log.error(details);
};

const turnOn = async () => {
    const config = {
        mode: 'fixed_servers',
        rules: {
            singleProxy: {
                scheme: 'https',
                host: 'local.msk2.ru.adguard.io',
                port: 443,
            },
        },
    };
    try {
        const result = await browser.proxy.settings.set({ value: config, scope: 'regular' });
        log.info(result);
    } catch (e) {
        log.error(`Unable to turn on proxy because of error, ${e.message}`);
    }
    log.info('Proxy turned on');
    browser.proxy.onProxyError.addListener(errorHandler);
};

const turnOff = async () => {
    try {
        await browser.proxy.settings.clear({ scope: 'regular' });
    } catch (e) {
        log.error(`Failed to turn off proxy due to error: ${e.message}`);
    }

    log.info('Proxy turned off');
    browser.proxy.onProxyError.removeListener(errorHandler);
};

const proxy = {
    turnOn,
    turnOff,
};

export default proxy;
