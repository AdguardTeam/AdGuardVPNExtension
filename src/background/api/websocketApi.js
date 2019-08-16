import ReconnectingWebSocket from 'reconnecting-websocket';

class WebsocketApi {
    constructor(url) {
        const ws = new ReconnectingWebSocket(url);
        ws.binaryType = 'arraybuffer';
        this.ws = ws;
    }

    async open() {
        return new Promise((resolve) => {
            this.ws.addEventListener('open', resolve);
        });
        // TODO [maximtop] reconnect on websocket disconnect
    }

    send(message) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message);
        }
    }

    onMessage(handler) {
        this.ws.addEventListener('message', handler);
    }
}


let websocketApi = new WebsocketApi('ws://192.168.11.191:8182/user_metrics');
// TODO [maximtop] use line from the up
websocketApi = {
    onMessage: () => {},
    send: () => {},
};
export default websocketApi;
