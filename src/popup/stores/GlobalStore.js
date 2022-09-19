import {
    action,
    computed,
    observable,
} from 'mobx';

import { MAX_GET_POPUP_DATA_ATTEMPTS, REQUEST_STATUSES } from './consts';
import { log } from '../../lib/logger';
import tabs from '../../background/tabs';
import { messenger } from '../../lib/messenger';

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
            if (!popupData) {
                // no popupData means that extension didn't load all necessary modules,
                // keep pending status to display loader until get message
                // about the extension is ready
                this.setInitStatus(REQUEST_STATUSES.PENDING);
                return;
            }

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
                isVpnEnabledByUrl,
                shouldShowRateModal,
                username,
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

            authStore.setFlagsStorageData(flagsStorageData);
            authStore.setIsFirstRun(isFirstRun);
            authStore.setUserEmail(username);
            authStore.setShouldShowRateModal(shouldShowRateModal);
            authStore.setShowConfirmEmail(vpnInfo.emailConfirmationRequired);
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
            await settingsStore.getExclusionsInverted();
            await settingsStore.getCurrentTabHostname();
            settingsStore.setIsExcluded(!isVpnEnabledByUrl);
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
