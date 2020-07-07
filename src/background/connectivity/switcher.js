import proxy from '../proxy';
import credentials from '../credentials';
import { locationsService } from '../endpoints/locationsService';
import { EVENT, MIN_CONNECTION_DURATION_MS } from './connectivityService/connectivityConstants';
import log from '../../lib/logger';
import { sleepIfNecessary } from '../../lib/helpers';
import endpoints from '../endpoints';
import connectivity from './index';
import { connectivityService } from './connectivityService/connectivityFSM';

/**
 * Turns on proxy after doing preparing steps
 * 1. Gets selected location
 * 2. Determines endpoint
 * 3. Gets credentials
 * 4. Sets credentials to proxy and WS connection
 * 5. Starts WS connection, when it is open it connects proxy in browser API
 * @param {boolean} forcePrevEndpoint - flag used to not always determine all endpoints pings
 * @returns {Promise<void>}
 */
export const turnOnProxy = async (forcePrevEndpoint = false) => {
    const entryTime = Date.now();
    try {
        const selectedLocation = await locationsService.getSelectedLocation();
        const selectedEndpoint = await locationsService.getEndpointByLocation(
            selectedLocation,
            forcePrevEndpoint
        );

        if (selectedEndpoint) {
            await proxy.setCurrentEndpoint(selectedEndpoint, selectedLocation);
        }

        const accessCredentials = await credentials.getAccessCredentials();

        const { domainName } = await proxy.setAccessPrefix(
            accessCredentials.credentialsHash,
            accessCredentials.credentials
        );

        connectivity.endpointConnectivity.setCredentials(
            domainName,
            accessCredentials.token,
            accessCredentials.credentialsHash
        );

        connectivity.endpointConnectivity.start(entryTime);
    } catch (e) {
        log.debug(e.message);
        await sleepIfNecessary(entryTime, MIN_CONNECTION_DURATION_MS);
        connectivityService.send(EVENT.CONNECTION_FAIL);
    }
};

/**
 * Turns off websocket
 * @returns {Promise<void>}
 */
export const turnOffProxy = async () => {
    await connectivity.endpointConnectivity.stop();
};

/**
 * Retries to connect to proxy
 * If refresh data is true, before connecting, refreshes tokens, vpnInfo and locations
 * @param refreshData
 * @returns {Promise<void>}
 */
export const turnOnProxyRetry = async (refreshData) => {
    await turnOffProxy();
    if (refreshData) {
        await endpoints.refreshData();
    }
    await turnOnProxy(true);
};
