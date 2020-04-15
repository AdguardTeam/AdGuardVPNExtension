import throttle from 'lodash/throttle';
import log from '../../lib/logger';
import { runWithCancel } from '../../lib/helpers';

class PopupData {
    constructor({
        permissionsChecker, permissionsError, nonRoutable, endpoints,
    }) {
        this.permissionsChecker = permissionsChecker;
        this.permissionsError = permissionsError;
        this.nonRoutable = nonRoutable;
        this.endpoints = endpoints;
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
        const endpointsList = await this.endpoints.getEndpoints();
        const selectedEndpoint = await this.endpoints.getSelectedEndpoint();
        const canControlProxy = await adguard.appStatus.canControlProxy();
        const isProxyEnabled = adguard.settings.isProxyEnabled();

        // If error check permissions when popup is opened, ignoring multiple retries
        if (error) {
            throttledPermissionsChecker();
        }

        return {
            permissionsError: error,
            vpnInfo,
            endpointsList,
            selectedEndpoint,
            isAuthenticated,
            canControlProxy,
            isProxyEnabled,
            isRoutable,
        };
    };

    sleep = (waitTime) => new Promise((resolve) => {
        setTimeout(resolve, waitTime);
    });

    retryCounter = 0;

    DEFAULT_RETRY_DELAY = 400;

    * getPopupDataRetry(url, retryNum = 1, retryDelay = this.DEFAULT_RETRY_DELAY) {
        const backoffIndex = 1.5;
        let data;

        try {
            data = yield this.getPopupData(url);
        } catch (e) {
            log.error(e);
        }

        this.retryCounter += 1;

        if (!data.isAuthenticated || data.permissionsError) {
            this.retryCounter = 0;
            return data;
        }

        const { vpnInfo, endpointsList, selectedEndpoint } = data;

        let hasRequiredData = true;

        if (!vpnInfo || !endpointsList || !selectedEndpoint) {
            if (retryNum <= 1) {
                // it may be useful to disconnect proxy if we can't get data
                if (data.isProxyEnabled) {
                    yield adguard.settings.disableProxy();
                }
                this.retryCounter = 0;
                hasRequiredData = false;
                return { ...data, hasRequiredData };
            }
            yield this.sleep(retryDelay);
            log.debug(`Retry get popup data again retry: ${this.retryCounter}`);
            return yield* this.getPopupDataRetry(url, retryNum - 1, retryDelay * backoffIndex);
        }

        this.retryCounter = 0;
        return { ...data, hasRequiredData };
    }

    getPopupDataRetryWithCancel = (url, retryNum) => {
        if (this.cancel) {
            this.cancel();
            this.retryCounter = 0;
        }
        const { promise, cancel } = runWithCancel(this.getPopupDataRetry.bind(this), url, retryNum);
        this.cancel = cancel;
        return promise;
    };

    /**
     * If popup is closed we call this function
     * This is done because if user doesn't wait until extension gets data and closes popup,
     * then extension freezes
     */
    cancelGettingPopupData = (reason) => {
        if (this.cancel) {
            this.cancel(reason);
        }
    };
}

export default PopupData;
