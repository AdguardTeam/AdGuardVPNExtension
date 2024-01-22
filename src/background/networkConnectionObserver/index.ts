// !IMPORTANT!
// './networkConnectionObserverAbstract' will be replaced during webpack compilation
// with NormalModuleReplacementPlugin to proper browser implementation
// from './networkConnectionObserverMv2' or './networkConnectionObserverMv3'
import { log } from '../../lib/logger';
import { permissionsChecker } from '../permissionsChecker';
import { connectivityService, ConnectivityEventType } from '../connectivity/connectivityService';

import { NetworkConnectionObserver } from './networkConnectionObserverAbstract';

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
    connectivityService.send(ConnectivityEventType.NetworkOnline);
};

export const networkConnectionObserver = new NetworkConnectionObserver(onlineHandler);
