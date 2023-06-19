const WebSocket = require('ws');

const portNum = 8080;

const wss = new WebSocket.Server({ port: portNum });

let wsConnectCount = 0;

wss.on('connection', (ws) => {
    console.log('WS connected');

    ws.on('close', () => {
        wsConnectCount += 1;
        console.log('WS disconnected');
        console.log(`Connection count: ${wsConnectCount}`);
    });
});

console.log(`WebSocket server started on port ${portNum}`);
