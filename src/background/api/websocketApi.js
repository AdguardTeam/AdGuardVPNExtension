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

const websocketApi = new WebsocketApi('wss://msk2.ru.adguard.io:8080/user_metrics');
websocketApi.open();

// eslint-disable-next-line import/prefer-default-export
export { websocketApi };
