import { NetworkConnectionObserver } from './networkConnectionObserverAbstract';
import { log } from '../../lib/logger';
import { permissionsChecker } from '../permissionsChecker';
import { connectivityService } from '../connectivity/connectivityService/connectivityFSM';
import { Event } from '../connectivity/connectivityService/connectivityConstants';

/**
 * Handler when network connection becomes online.
 * 1. Checks permissions
 * 2. Sends event to connectivity service FSM, to try to reconnect
 */
const onlineHandler = async (): Promise<void> => {
    log.debug('Browser switched to online mode');

    // always when connection is online we should check permissions
    await permissionsChecker.checkPermissions();

    // send event to WS connectivity service
    connectivityService.send(Event.NetworkOnline);
};

export const networkConnectionObserver = new NetworkConnectionObserver(onlineHandler);
