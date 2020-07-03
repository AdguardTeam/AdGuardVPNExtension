// import ReconnectingWebsocket from './ReconnectingWebsocket';
import log from '../../../lib/logger';

const websocketFactory = (() => {
    let ws;

    /**
     * Creates new websocket and closes the old one if found
     * @param {string} url
     * @returns {ReconnectingWebsocket}
     */
    const createReconnectingWebsocket = (url) => {
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

        // TODO implement in the connectivity module
        // approximately 1 hour,
        // after this number of retries websocket would stop trying to connect
        // and disconnect user from proxy
        // const NUMBER_OF_RETRIES = 365;

        ws = new WebSocket(url);
        ws.addEventListener('open', () => {
            console.log(`WS connected to: ${ws.url}`);
        });
        ws.binaryType = 'arraybuffer';

        return ws;
    };

    return {
        createReconnectingWebsocket,
    };
})();

export default websocketFactory;
