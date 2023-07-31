/* eslint-disable no-console */
const myWorker = new Worker('worker.js');

/**
 * For more details on this worker see ProxyAuthTrigger.
 * We don't use standard chrome.runtime.onMessage event in order to avoid conflicts with other messages handlers.
 * When we receive a message from the service worker, we send it to the worker.
 */
navigator.serviceWorker.addEventListener('message', (e) => {
    // cant use logger since local storage is not available here
    console.log(`offscreen document received message: ${e.data}`);
    myWorker.postMessage(e.data);
});
