import ReconnectingWebSocket from 'reconnecting-websocket';
import log from '../../../lib/logger';

/**
 * This class wraps reconnecting-websocket and provides async open and close methods
 * To read how reconnections works read documentation here
 * https://github.com/pladaria/reconnecting-websocket
 */
class ReconnectingWebsocket {
    DEFAULT_OPTIONS = {
        maxReconnectionDelay: 10000, // max delay in ms between reconnections
        minReconnectionDelay: 1000, // min delay in ms between reconnections
        reconnectionDelayGrowFactor: 1.3, // how fast the reconnection delay grows
        minUptime: 5000, // min time in ms to consider connection as stable
        connectionTimeout: 4000, // retry connect if not connected after this time, in ms
        maxRetries: Infinity, // maximum number of retries
        maxEnqueuedMessages: 0, // maximum number of messages to buffer until reconnection
        startClosed: false, // start websocket in CLOSED state, call `.reconnect()` to connect
        debug: false, // enables debug output
    };

    listeners = {
        error: [],
        message: [],
        open: [],
        close: [],
    }

    static get CONNECTING() {
        return 0;
    }

    static get OPEN() {
        return 1;
    }

    static get CLOSING() {
        return 2;
    }

    static get CLOSED() {
        return 3;
    }

    get CONNECTING() {
        return ReconnectingWebsocket.CONNECTING;
    }

    get OPEN() {
        return ReconnectingWebsocket.OPEN;
    }

    get CLOSING() {
        return ReconnectingWebsocket.CLOSING;
    }

    get CLOSED() {
        return ReconnectingWebsocket.CLOSED;
    }

    /**
     * Flag used to determine if close was called by user
     * @type {boolean}
     */
    closeCalled = false;

    /**
     * Flag used to limit close events firing
     * @type {boolean}
     */
    closeEventFired = false;

    constructor(url, options) {
        this.url = url;
        this.options = { ...this.DEFAULT_OPTIONS, ...options };
        this.closeCalled = false;
        this.closeEventFired = false;
    }

    addEventListener(type, listener) {
        if (this.listeners[type]) {
            this.listeners[type].push(listener);
        }
    }

    removeEventListener(type, listener) {
        if (this.listeners[type]) {
            this.listeners[type] = this.listeners[type].filter((l) => l !== listener);
        }
    }

    get readyState() {
        if (!this.ws || this.closeEventFired) {
            return ReconnectingWebSocket.CLOSED;
        }

        if (this.ws
            && !this.closeEventFired
            && !(this.ws.readyState === ReconnectingWebsocket.OPEN)) {
            return ReconnectingWebsocket.CONNECTING;
        }

        return this.ws.readyState;
    }

    open = async () => {
        return new Promise((resolve, reject) => {
            this.ws = new ReconnectingWebSocket(this.url, [], this.options);
            this.ws.binaryType = 'arraybuffer';

            const removeTempListeners = () => {
                /* eslint-disable no-use-before-define */
                this.ws.removeEventListener('open', resolveHandler);
                this.ws.removeEventListener('error', rejectHandler);
                this.ws.removeEventListener('close', rejectHandler);
                /* eslint-enable no-use-before-define */
            };

            const rejectHandler = () => {
                removeTempListeners();
                reject(new Error(`WS connection to ${this.url} unable due to an error event`));
            };

            const resolveHandler = () => {
                removeTempListeners();
                resolve();
            };

            this.ws.addEventListener('open', resolveHandler);
            this.ws.addEventListener('error', rejectHandler);
            this.ws.addEventListener('close', rejectHandler);

            this.addListeners();
        });
    }

    close() {
        this.closeCalled = true;
        return new Promise((resolve, reject) => {
            if (!this.ws) {
                resolve();
                return;
            }

            // resolve immediately if is closed already or closing
            if (this.ws.readyState === this.ws.CLOSED
                // in firefox during "CLOSING" ready state,
                // "ws.close()" method doesn't cause to fire close event
                // as result promise is never resolved
                || this.ws.readyState === this.ws.CLOSING) {
                this.removeListeners();
                // we call close() in order to stop reconnections
                this.ws.close();
                resolve();
                return;
            }

            this.ws.close();

            const removeListeners = () => {
                /* eslint-disable no-use-before-define */
                this.ws.removeEventListener('error', rejectHandler);
                this.ws.removeEventListener('close', resolveHandler);
                this.removeListeners();
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

    send(message) {
        this.ws.send(message);
    }

    handleOpen = (openEvent) => {
        log.debug(`WS connection to "${openEvent.target.url}" opened`);
        this.closeCalled = false;
        this.closeEventFired = false;
        this.listeners.open.forEach((listener) => listener(openEvent));
    }

    handleClose = (closeEvent) => {
        if (!this.ws) {
            return;
        }
        if (this.closeCalled) {
            log.debug(`WS connection to "${closeEvent.target.url}" closed`);
            this.closeEventFired = true;
            this.listeners.close.forEach((listener) => listener(closeEvent));
            return;
        }
        // notify only on final close
        if (this.ws.retryCount >= this.options.maxRetries && !this.closeEventFired) {
            log.debug(`WS connection to "${closeEvent.target.url}" closed`);
            this.closeEventFired = true;
            this.listeners.close.forEach((listener) => listener(closeEvent));
        }
    }

    handleMessage = (message) => {
        this.listeners.message.forEach((listener) => listener(message));
    }

    handleError = (errorEvent) => {
        log.debug(`WS connection to ${errorEvent.target.url} threw an error event:`, errorEvent);
        this.listeners.error.forEach((listener) => listener(errorEvent));
    }

    addListeners = () => {
        if (!this.ws) {
            return;
        }

        this.ws.addEventListener('open', this.handleOpen);
        this.ws.addEventListener('close', this.handleClose);
        this.ws.addEventListener('message', this.handleMessage);
        this.ws.addEventListener('error', this.handleError);
    }

    removeListeners = () => {
        if (!this.ws) {
            return;
        }

        this.ws.removeEventListener('open', this.handleOpen);
        this.ws.removeEventListener('close', this.handleClose);
        this.ws.removeEventListener('message', this.handleMessage);
        this.ws.removeEventListener('error', this.handleError);
    }
}

export default ReconnectingWebsocket;
