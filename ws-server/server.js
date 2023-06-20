const WebSocket = require('ws');

const portNum = 8080;

const wss = new WebSocket.Server({ port: portNum });

let wsConnectCount = 0;

const log = (message) => {
    const date = new Date();
    // eslint-disable-next-line no-console
    console.log(`[${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}]: ${message}`);
};

wss.on('connection', (ws) => {
    log('WS connected');

    ws.on('close', () => {
        wsConnectCount += 1;
        log('WS disconnected');
        log(`Connection count: ${wsConnectCount}`);
    });
});

log(`WebSocket server started on port ${portNum}`);
