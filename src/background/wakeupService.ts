import { Runtime } from 'webextension-polyfill';

const WAKEUP_PERIOD_MS = 1000 * 60; // 1 min

const deleteTimer = (port: Runtime.Port) => {
    // @ts-ignore
    if (port._timer) {
        // @ts-ignore
        clearTimeout(port._timer);
        // @ts-ignore
        // eslint-disable-next-line no-param-reassign
        delete port._timer;
    }
};

const forceReconnect = (port: Runtime.Port) => {
    deleteTimer(port);
    port.disconnect();
};
// @ts-ignore
chrome.runtime.onConnect.addListener((port: Runtime.Port) => {
    console.log('So, wake up, Mr. Service Worker. Wake up and smell the ashes.');
    if (port.name === 'swWaker') {
        port.onDisconnect.addListener(deleteTimer);
        // @ts-ignore
        // eslint-disable-next-line no-param-reassign
        port._timer = setTimeout(forceReconnect, WAKEUP_PERIOD_MS, port);
    }
});
