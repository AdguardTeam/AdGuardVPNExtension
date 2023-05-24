import { proxy } from '../proxy';
import { log } from '../../lib/logger';
import { runWithCancel, sleepIfNecessary } from '../../lib/helpers';
import { FORCE_CANCELLED } from '../../lib/constants';
import { vpnApi } from '../api';

// eslint-disable-next-line import/no-cycle
import { credentials } from '../credentials';
// eslint-disable-next-line import/no-cycle
import { locationsService } from '../endpoints/locationsService';
// eslint-disable-next-line import/no-cycle
import { endpoints } from '../endpoints';
// eslint-disable-next-line import/no-cycle
import { connectivity } from './index';
import {
    connectivityService,
    ConnectivityEventType,
    MIN_CONNECTION_DURATION_MS,
} from './connectivityService';
import type { AccessCredentialsData } from '../credentials/Credentials';
import type { EndpointInterface, LocationInterface } from '../schema';
import type { VpnConnectionStatus } from '../api/vpnApi';

/**
 * Turns on proxy after doing preparing steps
 * 1. Gets selected location
 * 2. Determines endpoint
 * 3. Gets credentials
 * 4. Sets credentials to proxy and WS connection
 * 5. Starts WS connection, when it is open it connects proxy in browser API
 * @param forcePrevEndpoint - flag used to not always determine all endpoints pings
 */
function* turnOnProxy(forcePrevEndpoint = false) {
    const entryTime = Date.now();
    try {
        const desktopVpnConnection: VpnConnectionStatus = yield vpnApi.getDesktopVpnConnectionStatus();

        if (desktopVpnConnection?.connected) {
            connectivityService.setDesktopVpnEnabled(true);
            return;
        }

        yield credentials.trackInstallation();
        const selectedLocation: LocationInterface | null = yield locationsService.getSelectedLocation();
        if (selectedLocation) {
            const selectedEndpoint: EndpointInterface | null = yield locationsService.getEndpointByLocation(
                selectedLocation,
                forcePrevEndpoint,
            );

            if (selectedEndpoint) {
                yield proxy.setCurrentEndpoint(selectedEndpoint, selectedLocation);
            }
        }

        const accessCredentials: AccessCredentialsData = yield credentials.getAccessCredentials();

        const { domainName } = yield proxy.setAccessCredentials(accessCredentials.credentials);

        connectivity.endpointConnectivity.setCredentials(
            domainName,
            accessCredentials.token,
            accessCredentials.credentialsHash,
        );

        connectivity.endpointConnectivity.start(entryTime);
    } catch (e) {
        log.debug(e.message);
        yield sleepIfNecessary(entryTime, MIN_CONNECTION_DURATION_MS);
        connectivityService.send(ConnectivityEventType.ConnectionFail);
    }
}

/**
 * Turns off websocket
 */
function* turnOffProxy(): Generator {
    yield connectivity.endpointConnectivity.stop();
}

class Switcher {
    private cancel?: Function;

    private promise: Promise<unknown>;

    turnOn(forcePrevEndpoint?: boolean) {
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
     */
    async retryTurnOn(refreshData?: boolean): Promise<void> {
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
