import proxy from '../proxy';
import credentials from '../credentials';
import { locationsService } from '../endpoints/locationsService';
import { EVENT, MIN_CONNECTION_DURATION_MS } from './connectivityService/connectivityConstants';
import log from '../../lib/logger';
import { runWithCancel, sleepIfNecessary } from '../../lib/helpers';
import endpoints from '../endpoints';
import connectivity from './index';
import { connectivityService } from './connectivityService/connectivityFSM';
import { FORCE_CANCELLED } from '../../lib/constants';

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
function* turnOnProxy(forcePrevEndpoint = false) {
    const entryTime = Date.now();
    try {
        const selectedLocation = yield locationsService.getSelectedLocation();
        const selectedEndpoint = yield locationsService.getEndpointByLocation(
            selectedLocation,
            forcePrevEndpoint
        );

        if (selectedEndpoint) {
            yield proxy.setCurrentEndpoint(selectedEndpoint, selectedLocation);
        }

        const accessCredentials = yield credentials.getAccessCredentials();

        const { domainName } = yield proxy.setAccessPrefix(
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
        yield sleepIfNecessary(entryTime, MIN_CONNECTION_DURATION_MS);
        connectivityService.send(EVENT.CONNECTION_FAIL);
    }
}

/**
 * Turns off websocket
 * @returns {Promise<void>}
 */
function* turnOffProxy() {
    yield connectivity.endpointConnectivity.stop();
}

class Switcher {
    turnOn(forcePrevEndpoint) {
        if (this.cancel) {
            this.cancel(FORCE_CANCELLED);
        }
        const { promise, cancel } = runWithCancel(turnOnProxy, forcePrevEndpoint);
        this.cancel = cancel;
        this.promise = promise;
        return promise;
    }

    turnOff() {
        if (this.cancel) {
            this.cancel(FORCE_CANCELLED);
        }
        const { promise, cancel } = runWithCancel(turnOffProxy);
        this.cancel = cancel;
        this.promise = promise;
        return promise;
    }

    /**
     * Retries to connect to proxy
     * If refresh data is true, before connecting, refreshes tokens, vpnInfo and locations
     * @param refreshData
     * @returns {Promise<void>}
     */
    async retryTurnOn(refreshData) {
        try {
            await this.turnOff();
            if (refreshData) {
                await endpoints.refreshData();
            }
            await this.turnOn(true);
        } catch (e) {
            log.debug(e);
        }
    }
}

export const switcher = new Switcher();
