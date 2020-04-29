import throttle from 'lodash/throttle';
import log from '../../lib/logger';

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
        const endpointsList = await this.endpoints.getEndpoints();
        const selectedEndpoint = await this.endpoints.getSelectedEndpoint();
        const canControlProxy = await adguard.appStatus.canControlProxy();
        const isProxyEnabled = adguard.settings.isProxyEnabled();
        const isPremiumToken = await this.credentials.isPremiumToken();

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
            isPremiumToken,
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

        const { vpnInfo, endpointsList, selectedEndpoint } = data;

        let hasRequiredData = true;

        if (!vpnInfo || !endpointsList || !selectedEndpoint) {
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
