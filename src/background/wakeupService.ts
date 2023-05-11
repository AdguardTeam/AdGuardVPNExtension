import browser from 'webextension-polyfill';

const WAKEUP_PERIOD_MS = 1000 * 60; // 1 min
const SERVICE_WORKER_WAKEUP = 'serviceWorkerWakeUp';

interface CustomPortType extends browser.Runtime.Port {
    timer?: number;
}

const deleteTimer = (port: CustomPortType) => {
    if (port.timer) {
        clearTimeout(port.timer);
        // eslint-disable-next-line no-param-reassign
        delete port.timer;
    }
};

const forceReconnect = (port: CustomPortType) => {
    deleteTimer(port);
    port.disconnect();
};

browser.runtime.onConnect.addListener((port: CustomPortType) => {
    if (port.name === SERVICE_WORKER_WAKEUP) {
        port.onDisconnect.addListener(deleteTimer);
        // @ts-ignore
        // eslint-disable-next-line no-param-reassign
        port.timer = setTimeout(forceReconnect, WAKEUP_PERIOD_MS, port);
    }
});
