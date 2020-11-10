import { log } from '../../../lib/logger';

const websocketFactory = (() => {
    let ws;

    /**
     * Creates new websocket and closes the old one if found
     * @param {string} url
     * @returns {WebSocket}
     */
    const createWebsocket = (url) => {
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

export default websocketFactory;
