import throttle from 'lodash/throttle';
import isEmpty from 'lodash/isEmpty';
import log from '../../lib/logger';
import connectivity from '../connectivity';
import { connectivityService } from '../connectivity/connectivityFSM';

class PopupData {
    constructor({
        permissionsChecker,
        permissionsError,
        nonRoutable,
        endpoints,
        credentials,
    }) {
        this.permissionsChecker = permissionsChecker;
        this.permissionsError = permissionsError;
        this.nonRoutable = nonRoutable;
        this.endpoints = endpoints;
        this.credentials = credentials;
    }

    getPopupData = async (url) => {
        const isAuthenticated = await adguard.auth.isAuthenticated();
        const throttledPermissionsChecker = throttle(
            this.permissionsChecker.checkPermissions,
            2000
        );

        if (!isAuthenticated) {
            return {
                isAuthenticated,
            };
        }

        const error = this.permissionsError.getError();
        const isRoutable = this.nonRoutable.isUrlRoutable(url);
        const vpnInfo = this.endpoints.getVpnInfo();
        const locations = this.endpoints.getLocations();
        const selectedLocation = await this.endpoints.getSelectedLocation();
        const canControlProxy = await adguard.appStatus.canControlProxy();
        const isProxyEnabled = adguard.settings.isProxyEnabled();
        const isConnectivityWorking = connectivity.endpointConnectivity.isWorking();
        const isPremiumToken = await this.credentials.isPremiumToken();
        // TODO consider to separate abstraction level
        const connectivityState = { value: connectivityService.state.value };

        // If error check permissions when popup is opened, ignoring multiple retries
        if (error) {
            throttledPermissionsChecker();
        }

        const simplifiedError = error ? {
            message: error.message,
            status: error.status,
        } : null;

        return {
            // Firefox can't message to the popup error instance,
            // that's why we convert it to the simpler object
            permissionsError: simplifiedError,
            vpnInfo,
            locations,
            selectedLocation,
            isAuthenticated,
            canControlProxy,
            isProxyEnabled,
            isConnectivityWorking,
            isRoutable,
            isPremiumToken,
            connectivityState,
        };
    };

    sleep = (waitTime) => new Promise((resolve) => {
        setTimeout(resolve, waitTime);
    });

    retryCounter = 0;

    DEFAULT_RETRY_DELAY = 400;

    async getPopupDataRetry(url, retryNum = 1, retryDelay = this.DEFAULT_RETRY_DELAY) {
        const backoffIndex = 1.5;
        let data;

        try {
            data = await this.getPopupData(url);
        } catch (e) {
            log.error(e);
        }

        this.retryCounter += 1;

        if (!data.isAuthenticated || data.permissionsError) {
            this.retryCounter = 0;
            return data;
        }

        const { vpnInfo, locations, selectedLocation } = data;

        let hasRequiredData = true;

        if (!vpnInfo || isEmpty(locations) || !selectedLocation) {
            if (retryNum <= 1) {
                // it may be useful to disconnect proxy if we can't get data
                if (data.isProxyEnabled) {
                    await adguard.settings.disableProxy();
                }
                this.retryCounter = 0;
                hasRequiredData = false;
                return { ...data, hasRequiredData };
            }
            await this.sleep(retryDelay);
            log.debug(`Retry get popup data again retry: ${this.retryCounter}`);
            return this.getPopupDataRetry(url, retryNum - 1, retryDelay * backoffIndex);
        }

        this.retryCounter = 0;
        return { ...data, hasRequiredData };
    }
}

export default PopupData;
