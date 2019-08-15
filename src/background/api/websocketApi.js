class WebsocketApi {
    constructor(url) {
        const ws = new WebSocket(url);
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
        this.ws.send(message);
    }

    onMessage(handler) {
        this.ws.addEventListener('message', handler);
    }
}

const websocketApi = new WebsocketApi('ws://192.168.11.191:8182/user_metrics');

export default websocketApi;
