import log from '../../../lib/logger';

/**
 * Wrapper around native websocket.
 * Implemented to add async methods for open and close actions
 */
class NativeWebsocket {
    constructor(url) {
        this.url = url;
    }

    create() {
        this.ws = new WebSocket(this.url);

        this.ws.binaryType = 'arraybuffer';

        this.onError((event) => {
            log.debug('Error occurred with socket event:', event);
        });
    }

    open() {
        return new Promise((resolve, reject) => {
            this.create();

            const removeListeners = () => {
                /* eslint-disable no-use-before-define */
                this.ws.removeEventListener('open', resolveHandler);
                this.ws.removeEventListener('error', rejectHandler);
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

            this.ws.addEventListener('open', resolveHandler);
            this.ws.addEventListener('error', rejectHandler);
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

    close() {
        return new Promise((resolve, reject) => {
            if (!this.ws) {
                reject(new Error('No websocket instance'));
                return;
            }
            this.ws.close();
            // resolve immediately if is closed already
            if (this.ws.readyState === this.ws.CLOSED) {
                resolve();
                return;
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

export default NativeWebsocket;
