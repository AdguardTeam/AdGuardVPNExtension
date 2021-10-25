import {
    action,
    computed,
    observable,
} from 'mobx';

import { MAX_GET_POPUP_DATA_ATTEMPTS, REQUEST_STATUSES } from './consts';
import { log } from '../../lib/logger';
import tabs from '../../background/tabs';
import messenger from '../../lib/messenger';

export class GlobalStore {
    @observable initStatus = REQUEST_STATUSES.PENDING;

    constructor(rootStore) {
        this.rootStore = rootStore;
    }

    @action
    async getPopupData(numberOfTries = 1) {
        const { rootStore: { vpnStore, settingsStore, authStore } } = this;

        this.setInitStatus(REQUEST_STATUSES.PENDING);

        // Used tab api because calling tab api from background returns wrong result
        const tab = await tabs.getCurrent();

        try {
            const popupData = await messenger.getPopupData(tab.url, numberOfTries);

            const {
                vpnInfo,
                locations,
                selectedLocation,
                permissionsError,
                isAuthenticated,
                canControlProxy,
                isRoutable,
                hasRequiredData,
                isPremiumToken,
                connectivityState,
                promoNotification,
                policyAgreement,
                desktopVpnEnabled,
                isFirstRun,
                flagsStorageData,
            } = popupData;

            if (!isAuthenticated) {
                authStore.setIsAuthenticated(isAuthenticated);
                await authStore.handleInitPolicyAgreement(policyAgreement);
                await authStore.getAuthCacheFromBackground();
                this.setInitStatus(REQUEST_STATUSES.DONE);
                return;
            }

            if (permissionsError) {
                settingsStore.setGlobalError(permissionsError);
            } else if (!hasRequiredData) {
                settingsStore.setGlobalError(new Error('No required data'));
            } else {
                settingsStore.setGlobalError(null);
            }

            if (!flagsStorageData) {
                settingsStore.setGlobalError(new Error('No flags storage data'));
            } else {
                authStore.setFlagsStorageData(flagsStorageData);
            }

            authStore.setIsFirstRun(isFirstRun);
            settingsStore.setCanControlProxy(canControlProxy);
            settingsStore.setConnectivityState(connectivityState);
            settingsStore.setIsRoutable(isRoutable);
            settingsStore.setPromoNotification(promoNotification);
            settingsStore.setDesktopVpnEnabled(desktopVpnEnabled);
            vpnStore.setVpnInfo(vpnInfo);
            vpnStore.setLocations(locations);
            vpnStore.setSelectedLocation(selectedLocation);
            vpnStore.setIsPremiumToken(isPremiumToken);
            authStore.setIsAuthenticated(isAuthenticated);
            await authStore.getAuthCacheFromBackground();
            await authStore.setPolicyAgreement(policyAgreement);
            await settingsStore.checkRateStatus();
            await settingsStore.checkIsExcluded();
            await settingsStore.getExclusionsInverted();
            this.setInitStatus(REQUEST_STATUSES.DONE);
        } catch (e) {
            log.error(e.message);
            this.setInitStatus(REQUEST_STATUSES.ERROR);
        }
    }

    @action
    async init() {
        await this.getPopupData(MAX_GET_POPUP_DATA_ATTEMPTS);
    }

    @action
    setInitStatus(status) {
        this.initStatus = status;
    }

    @computed
    get status() {
        return this.initStatus;
    }
}
