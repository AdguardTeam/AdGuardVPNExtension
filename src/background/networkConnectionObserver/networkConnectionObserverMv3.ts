import { log } from '../../lib/logger';
import { permissionsChecker } from '../permissionsChecker';
import { connectivityService } from '../connectivity/connectivityService/connectivityFSM';
import { Event } from '../connectivity/connectivityService/connectivityConstants';

// TODO: fix NetworkConnectionObserver implementation:
//  listen for the online event, when it will be fixed in mv3,
//  instead of using setInterval to check navigator.onLine
//  https://bugs.chromium.org/p/chromium/issues/detail?id=1442046#c7

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

    /**
     * Starts checking if the network connection is online at a specified time interval.
     */
    private startCheckIsOnline() {
        setInterval(() => {
            this.setIsOnline(navigator.onLine);
        }, this.CHECK_ONLINE_INTERVAL_MS);
    }

    /**
     * Calls handler if network connection become online and sets isOnline value.
     */
    private setIsOnline(isOnline: boolean) {
        if (isOnline && !this.isOnline) {
            this.onlineHandler();
        }
        this.isOnline = isOnline;
    }

    /**
     * Handles the event when the browser switches to online mode:
     * checks permissions and sends event to connectivity service FSM,
     * to try to reconnect
     */
    private onlineHandler = async () => {
        log.debug('Browser switched to online mode');

        // always when connection is online we should check permissions
        await permissionsChecker.checkPermissions();

        // send event to WS connectivity service
        connectivityService.send(Event.NetworkOnline);
    };
}

export const networkConnectionObserver = new NetworkConnectionObserver();
