import browser from 'webextension-polyfill';
import log from '../lib/logger';

const pacScript = `
    function FindProxyForURL(url, host) {
        if (host.indexOf('jira.adguard.com') !== -1
            || host.indexOf('jira.performix.ru') !== -1
            || host.indexOf('bit.adguard.com') !== -1) {
            return 'DIRECT';
        }
        return 'HTTPS local.msk2.ru.adguard.io:443';
    }`;

const errorHandler = (details) => {
    log.error(details);
};

const turnOn = async () => {
    const config = {
        mode: 'pac_script',
        pacScript: {
            data: pacScript,
            mandatory: true,
        },
    };
    try {
        await browser.proxy.settings.set({ value: config, scope: 'regular' });
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
