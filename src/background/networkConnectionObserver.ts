import { permissionsChecker } from './permissionsChecker';
import { log } from '../lib/logger';
import { connectivityService } from './connectivity/connectivityService/connectivityFSM';
import { Event } from './connectivity/connectivityService/connectivityConstants';
import { browserApi } from './browserApi';

/**
 * Module observes network state
 * When network connection becomes online it (module)
 * 1. Checks permissions
 * 2. Sends event to connectivity service FSM, to try to reconnect
 */
export class NetworkConnectionObserver {
    constructor() {
        // TODO: implement networkConnectionObserver for mv3
        if (browserApi.runtime.isManifestVersion2()) {
            window.addEventListener('online', this.connectionHandler);
        }
    }

    connectionHandler = async (): Promise<void> => {
        log.debug('Browser switched to online mode');

        // always when connection is online we should check permissions
        await permissionsChecker.checkPermissions();

        // send event to WS connectivity service
        connectivityService.send(Event.NetworkOnline);
    };
}

const networkConnectionObserver = new NetworkConnectionObserver();

export default networkConnectionObserver;
