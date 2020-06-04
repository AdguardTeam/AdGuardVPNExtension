import ReconnectingWebsocket from './ReconnectingWebsocket';
import log from '../../../lib/logger';

const websocketFactory = (() => {
    let reconnectingWebsocket;

    /**
     * Creates new websocket and closes the old one if found
     * @param {string} url
     * @returns {ReconnectingWebsocket}
     */
    const createReconnectingWebsocket = async (url) => {
        if (!url) {
            throw new Error('Url expected to be provided');
        }
        // Close previously opened websocket
        if (reconnectingWebsocket) {
            try {
                await reconnectingWebsocket.close();
            } catch (e) {
                log.debug(e);
            }
        }

        // approximately 1 hour,
        // after this number of retries websocket would stop trying to connect
        // and disconnect user from proxy
        const NUMBER_OF_RETRIES = 365;
        reconnectingWebsocket = new ReconnectingWebsocket(url, { maxRetries: NUMBER_OF_RETRIES });
        return reconnectingWebsocket;
    };

    return {
        createReconnectingWebsocket,
    };
})();

export default websocketFactory;
