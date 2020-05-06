import ReconnectingWebsocket from './ReconnectingWebsocket';
import NativeWebsocket from './NativeWebsocket';
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
        reconnectingWebsocket = new ReconnectingWebsocket(url);
        return reconnectingWebsocket;
    };

    /**
     * Creates new websocket whenever is called
     * @param {string} url
     * @returns {NativeWebsocket}
     */
    const createNativeWebsocket = async (url) => {
        if (!url) {
            throw new Error('No url was provided');
        }
        return new NativeWebsocket(url);
    };

    return {
        createNativeWebsocket,
        createReconnectingWebsocket,
    };
})();

export default websocketFactory;
