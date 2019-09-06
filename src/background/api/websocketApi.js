import { WEBSOCKET_API_URL } from '../config';

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
    }

    send(message) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(message);
        }
    }

    onMessage(handler) {
        this.ws.addEventListener('message', handler);
    }

    removeMessageListener(handler) {
        this.ws.removeEventListener('message', handler);
    }

    onError(cb) {
        this.ws.addEventListener('error', cb);
    }
}

const websocketApi = new WebsocketApi(WEBSOCKET_API_URL);

websocketApi.onError((error) => {
    console.log(error);
});

// eslint-disable-next-line import/prefer-default-export
export { websocketApi };
