import { log } from '../../lib/logger';
import { permissionsChecker } from '../permissionsChecker';
import { connectivityService } from '../connectivity/connectivityService/connectivityFSM';
import { Event } from '../connectivity/connectivityService/connectivityConstants';

/**
 * Module observes network state
 * When network connection becomes online it (module)
 * 1. Checks permissions
 * 2. Sends event to connectivity service FSM, to try to reconnect
 */
export class NetworkConnectionObserver {
    private CHECK_ONLINE_INTERVAL_MS = 500;

    private isOnline: boolean;

    constructor() {
        this.isOnline = navigator.onLine;
        this.startCheckIsOnline();
    }

    private startCheckIsOnline() {
        setInterval(() => {
            this.setIsOnline(navigator.onLine);
        }, this.CHECK_ONLINE_INTERVAL_MS);
    }

    private setIsOnline(isOnline: boolean) {
        if (isOnline && !this.isOnline) {
            this.onlineHandler();
        }
        this.isOnline = isOnline;
    }

    private onlineHandler = async () => {
        log.debug('Browser switched to online mode');

        // always when connection is online we should check permissions
        await permissionsChecker.checkPermissions();

        // send event to WS connectivity service
        connectivityService.send(Event.NetworkOnline);
    };
}

export const networkConnectionObserver = new NetworkConnectionObserver();
