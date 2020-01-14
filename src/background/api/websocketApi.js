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
        return new Promise((resolve, reject) => {
            this.ws.reconnect();

            const removeListeners = () => {
                /* eslint-disable no-use-before-define */
                this.ws.removeEventListener('open', resolveHandler);
                this.ws.removeEventListener('error', rejectHandler);
                /* eslint-enable no-use-before-define */
            };

            // TODO [maximtop] implement own websocket reconnecting library,
            //  or find out and fix error in the used library "reconnecting-websocket".
            //  Currently if we call .reconnect() method right after ws constructor
            //  to the distant endpoints, e.g. Australia, Sydney
            //  reconnecting-websocket fails with error:
            //  "failed: Error in connection establishment: net::ERR_SSL_PROTOCOL_ERROR"

            // Uses 1 redundant attempt to avoid error described above
            const MAX_OPEN_ATTEMPTS = 1;
            let attempts = MAX_OPEN_ATTEMPTS;
            function rejectHandler(e) {
                if (attempts) {
                    attempts -= 1;
                    return;
                }
                reject(e);
                attempts = MAX_OPEN_ATTEMPTS;
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
        return new Promise((resolve, reject) => {
            this.ws.close();
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

            function rejectHandler(e) {
                reject(e);
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
