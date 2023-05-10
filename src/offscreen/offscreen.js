/* global chrome */

const onlineHandler = () => {
    chrome.runtime.sendMessage({
        target: 'service_worker',
        type: 'network_online',
    });
};

window.addEventListener('online', onlineHandler);
