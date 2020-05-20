import notifier from '../lib/notifier';
import settings from './settings/settings';
import permissionsChecker from './permissionsChecker';
import log from '../lib/logger';

/**
 * Module observes network state
 * When network connection is becomes online it
 * 1. Checks permissions
 * 2. Reconnects proxy if it was closed when websocket was unable to connect because network was
 *      offline
 */
export class NetworkConnectionObserver {
    /**
     * Flag used to observe if it is necessary to reconnect websocket when network is back online
     * @type {boolean}
     */
    shouldReconnectWebsocket = false;

    constructor() {
        notifier.addSpecifiedListener(notifier.types.WEBSOCKET_CLOSED, this.websocketCloseHandler);
        window.addEventListener('online', this.connectionHandler);
    }

    /**
     * When websocket stops trying to reconnect it fires websocket closed event
     * on this event we should disable proxy and reconnect it later when internet is enabled
     * @returns {Promise<void>}
     */
    websocketCloseHandler = async () => {
        await settings.disableProxy();
        // if network is offline we should reconnect again later
        if (!navigator.onLine) {
            this.shouldReconnectWebsocket = true;
        }
    }

    connectionHandler = async () => {
        log.debug('Browser switched to online mode');
        try {
            // always when connection is online we should check permissions
            await permissionsChecker.checkPermissions();

            // reconnect if websocket was closed when network was offline
            if (this.shouldReconnectWebsocket) {
                this.shouldReconnectWebsocket = false;
                await settings.enableProxy(false, true);
            }
        } catch (e) {
            log.debug(e.message);
        }
    };
}

const networkConnectionObserver = new NetworkConnectionObserver();

export default networkConnectionObserver;
