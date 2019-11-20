import ReconnectingWebSocket from 'reconnecting-websocket';
import log from '../../lib/logger';

class WebsocketApi {
    RECONNECTING_OPTIONS = {
        maxReconnectionDelay: 10000,
        minReconnectionDelay: 1000 + Math.random() * 4000,
        reconnectionDelayGrowFactor: 1.3,
        minUptime: 5000,
        connectionTimeout: 4000,
        maxRetries: Infinity,
        maxEnqueuedMessages: Infinity,
        startClosed: false,
        debug: false,
    };

    constructor(url) {
        try {
            const ws = new ReconnectingWebSocket(url, [], this.RECONNECTING_OPTIONS);
            ws.binaryType = 'arraybuffer';
            this.ws = ws;
        } catch (e) {
            log.error('Unable to create websocket connection: ', e.message);
        }

        this.onClose((event) => {
            log.info('WebSocket closed with next event code:', event.code);
        });

        this.onError((event) => {
            log.warn('Error happened with socket:', event);
        });

        this.onOpen((event) => {
            const { target: { url } } = event;
            log.info(`Websocket connection to: ${url} opened. Retry count: ${this.ws.retryCount}`);
        });
    }

    async open() {
        return new Promise((resolve, reject) => {
            this.ws.addEventListener('open', resolve);
            this.onError(() => {
                reject(new Error('Failed to open websocket connection'));
            });
        });
    }

    send(message) {
        if (this.ws.readyState === ReconnectingWebSocket.OPEN) {
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

    onClose(cb) {
        this.ws.addEventListener('close', cb);
    }

    onOpen(cb) {
        this.ws.addEventListener('open', cb);
    }

    close() {
        this.ws.close();
    }
}

const wsFactory = (() => {
    let ws;

    const getWebsocket = async (url) => {
        if (!url) {
            return null;
        }
        if (ws) {
            ws.close();
        }
        ws = new WebsocketApi(url);
        await ws.open();
        return ws;
    };

    return {
        getWebsocket,
    };
})();

export default wsFactory;
