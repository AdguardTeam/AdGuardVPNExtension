/* global chrome */

const connect = () => {
    const port = chrome.runtime.connect({ name: 'serviceWorkerWakeUp' });
    port.onDisconnect.addListener(connect);
};

connect();
