import throttle from 'lodash/throttle';
import isEmpty from 'lodash/isEmpty';

import { log } from '../../lib/logger';
import { connectivityService } from '../connectivity/connectivityService/connectivityFSM';
import { promoNotifications } from '../promoNotifications';
import auth from '../auth';
import { settings } from '../settings';
import { SETTINGS_IDS } from '../../lib/constants';
import { vpnApi } from '../api';
import { updateService } from '../updateService';
import { flagsStorage } from '../flagsStorage';
import { exclusions } from '../exclusions';

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

    async getDesktopEnabled() {
        let { desktopVpnEnabled } = connectivityService.state.context;
        if (desktopVpnEnabled) {
            const desktopVpnConnection = await vpnApi.getDesktopVpnConnectionStatus();
            desktopVpnEnabled = !!desktopVpnConnection.connected;
        }
        return desktopVpnEnabled;
    }

    getPopupData = async (url) => {
        const isAuthenticated = await auth.isAuthenticated();
        const policyAgreement = settings.getSetting(SETTINGS_IDS.POLICY_AGREEMENT);

        if (!isAuthenticated) {
            return {
                isAuthenticated,
                policyAgreement,
            };
        }

        // max_downloaded_bytes in vpnInfo will be recalculated according invited
        // users by referral program only after credentials requested
        await this.permissionsChecker.checkPermissions();
        const error = this.permissionsError.getError();
        const isRoutable = this.nonRoutable.isUrlRoutable(url);
        const vpnInfo = await this.endpoints.getVpnInfo();
        const locations = this.endpoints.getLocations();
        const selectedLocation = await this.endpoints.getSelectedLocation();
        const canControlProxy = await adguard.appStatus.canControlProxy();
        const isProxyEnabled = adguard.settings.isProxyEnabled();
        const isPremiumToken = await this.credentials.isPremiumToken();
        const connectivityState = { value: connectivityService.state.value };
        const desktopVpnEnabled = await this.getDesktopEnabled();
        const promoNotification = await promoNotifications.getCurrentNotification();
        const { isFirstRun } = updateService;
        const flagsStorageData = await flagsStorage.getFlagsStorageData();
        const isVpnEnabledByUrl = exclusions.isVpnEnabledByUrl(url);

        // If error check permissions when popup is opened, ignoring multiple retries
        if (error) {
            throttle(
                this.permissionsChecker.checkPermissions,
                2000,
            );
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
            policyAgreement,
            canControlProxy,
            isProxyEnabled,
            isRoutable,
            isPremiumToken,
            connectivityState,
            promoNotification,
            desktopVpnEnabled,
            isFirstRun,
            flagsStorageData,
            isVpnEnabledByUrl,
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
