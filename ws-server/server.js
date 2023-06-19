const WebSocket = require('ws');

const { log } = console;

const portNum = 8080;

const wss = new WebSocket.Server({ port: portNum });

let wsConnectCount = 0;

wss.on('connection', (ws) => {
    log('WS connected');

    ws.on('close', () => {
        wsConnectCount += 1;
        log('WS disconnected');
        log(`Connection count: ${wsConnectCount}`);
    });
});

log(`WebSocket server started on port ${portNum}`);
