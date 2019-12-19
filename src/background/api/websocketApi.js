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
        startClosed: true,
        debug: false,
    };

    constructor(url) {
        const ws = new ReconnectingWebSocket(url, [], this.RECONNECTING_OPTIONS);
        ws.binaryType = 'arraybuffer';
        this.ws = ws;

        this.onClose((event) => {
            log.info('WebSocket closed with next event code:', event.code);
        });

        this.onError((event) => {
            log.warn('Error occurred with socket event:', event);
        });

        this.onOpen((event) => {
            const { target: { url } } = event;
            log.info(`Websocket connection to: ${url} opened. Retry count: ${this.ws.retryCount}`);
        });
    }

    open() {
        this.ws.reconnect();
        return new Promise((resolve, reject) => {
            const removeListeners = () => {
                /* eslint-disable no-use-before-define */
                this.ws.removeEventListener('open', resolveHandler);
                this.ws.removeEventListener('error', rejectHandler);
                /* eslint-enable no-use-before-define */
            };

            function rejectHandler() {
                reject();
                removeListeners();
            }

            function resolveHandler() {
                resolve();
                removeListeners();
            }

            this.ws.addEventListener('open', resolveHandler);
            this.ws.addEventListener('error', rejectHandler);
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
        return new Promise((resolve, reject) => {
            // resolve immediately if is closed already
            if (this.ws.readyState === 3) {
                resolve();
            }

            const removeListeners = () => {
                /* eslint-disable no-use-before-define */
                this.ws.removeEventListener('error', rejectHandler);
                this.ws.removeEventListener('close', resolveHandler);
                /* eslint-enable no-use-before-define */
            };

            function rejectHandler() {
                reject();
                removeListeners();
            }

            function resolveHandler() {
                resolve();
                removeListeners();
            }

            this.ws.addEventListener('close', resolveHandler);
            this.ws.addEventListener('error', rejectHandler);
        });
    }
}

const wsFactory = (() => {
    let ws;

    const getWebsocket = async (url) => {
        if (!url) {
            return null;
        }
        if (ws) {
            await ws.close();
        }
        ws = new WebsocketApi(url);
        return ws;
    };

    return {
        getWebsocket,
    };
})();

export default wsFactory;
