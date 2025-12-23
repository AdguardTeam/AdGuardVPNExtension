import { log } from '../../common/logger';
import { permissionsChecker } from '../permissionsChecker';
import { connectivityService, ConnectivityEventType } from '../connectivity/connectivityService';

import { NetworkConnectionObserver } from './networkConnectionObserver';

/**
 * Handler when network connection becomes online.
 * 1. Checks permissions
 * 2. Sends event to connectivity service FSM, to try to reconnect
 */
const onlineHandler = async (): Promise<void> => {
    log.debug('[vpn.index]: Browser switched to online mode');

    // always when connection is online we should check permissions
    await permissionsChecker.checkPermissions();

    // send event to WS connectivity service
    connectivityService.send(ConnectivityEventType.NetworkOnline);
};

export const networkConnectionObserver = new NetworkConnectionObserver(onlineHandler);
