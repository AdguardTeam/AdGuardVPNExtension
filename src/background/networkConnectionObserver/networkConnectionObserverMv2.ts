import { permissionsChecker } from '../permissionsChecker';
import { log } from '../../lib/logger';
import { connectivityService } from '../connectivity/connectivityService/connectivityFSM';
import { Event } from '../connectivity/connectivityService/connectivityConstants';

/**
 * Module observes network state
 * When network connection becomes online it (module)
 * 1. Checks permissions
 * 2. Sends event to connectivity service FSM, to try to reconnect
 */
export class NetworkConnectionObserver {
    constructor() {
        window.addEventListener('online', this.connectionHandler);
    }

    connectionHandler = async (): Promise<void> => {
        log.debug('Browser switched to online mode');

        // always when connection is online we should check permissions
        await permissionsChecker.checkPermissions();

        // send event to WS connectivity service
        connectivityService.send(Event.NetworkOnline);
    };
}

export const networkConnectionObserver = new NetworkConnectionObserver();
