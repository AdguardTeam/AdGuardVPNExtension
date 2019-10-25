import log from '../../lib/logger';

class WebsocketApi {
    constructor(url) {
        try {
            const ws = new WebSocket(url);
            ws.binaryType = 'arraybuffer';
            this.ws = ws;
        } catch (e) {
            log.error(e.message);
        }

        this.onClose((event) => {
            log.info('websocket closed with next event code:', event.code);
        });

        this.onError((event) => {
            log.error('there was an error with your socket:', event);
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

    onClose(cb) {
        this.ws.addEventListener('close', cb);
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
