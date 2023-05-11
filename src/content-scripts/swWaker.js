/* global chrome */

console.log('%%%%% swWaker injected here!!!');

function connect() {
    const port = chrome.runtime.connect({ name: 'swWaker' });
    port.onDisconnect.addListener(connect);
}

connect();
