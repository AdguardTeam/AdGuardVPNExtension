import { log } from '../../../common/logger';

export const websocketFactory = (() => {
    let ws: WebSocket;

    /**
     * Creates new websocket and closes the old one if found
     * @param url
     */
    const createWebsocket = (url: string): WebSocket => {
        if (!url) {
            throw new Error('Url expected to be provided');
        }

        // Close previously opened websocket
        if (ws) {
            try {
                ws.close();
            } catch (e) {
                log.debug(e);
            }
        }

        ws = new WebSocket(url);
        ws.binaryType = 'arraybuffer';

        return ws;
    };

    return {
        createWebsocket,
    };
})();
