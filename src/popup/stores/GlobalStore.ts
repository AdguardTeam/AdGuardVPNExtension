import { action, computed, observable } from 'mobx';

import { log } from '../../common/logger';
import { tabs } from '../../background/tabs';
import { messenger } from '../../common/messenger';

import type { RootStore } from './RootStore';
import { MAX_GET_POPUP_DATA_ATTEMPTS, RequestStatus } from './constants';

export class GlobalStore {
    @observable initStatus = RequestStatus.Pending;

    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    /**
     * Checks whether the desktop AdGuard VPN apps are supported for the current OS.
     * Sets the result to the settings store.
     */
    @action
    async getDesktopAppData(): Promise<void> {
        const { rootStore: { settingsStore } } = this;
        await settingsStore.setHasDesktopAppForOs();
    }

    /**
     * Checks whether the extension is running on a android browser.
     * Sets the result to the settings store.
     */
    @action
    async getAndroidData(): Promise<void> {
        const { rootStore: { settingsStore } } = this;
        await settingsStore.setIsAndroidBrowser();
    }

    @action
    async getPopupData(numberOfTries = 1): Promise<void> {
        const { rootStore } = this;
        const {
            vpnStore,
            settingsStore,
            authStore,
            telemetryStore,
        } = rootStore;

        this.setInitStatus(RequestStatus.Pending);

        // Used tab api because calling tab api from background returns wrong result
        const tab = await tabs.getCurrent();
        const url = tab.url || null;

        try {
            const popupData = await messenger.getPopupData(url, numberOfTries);

            const {
                vpnInfo,
                locations,
                selectedLocation,
                permissionsError,
                forwarderDomain,
                isAuthenticated,
                canControlProxy,
                isRoutable,
                hasRequiredData,
                isPremiumToken,
                connectivityState,
                promoNotification,
                policyAgreement,
                helpUsImprove,
                isFirstRun,
                flagsStorageData,
                isVpnEnabledByUrl,
                shouldShowRateModal,
                shouldShowHintPopup,
                shouldShowMobileEdgePromoBanner,
                isVpnBlocked,
                isHostPermissionsGranted,
                locationsTab,
                savedLocationIds,
            } = popupData;

            settingsStore.setForwarderDomain(forwarderDomain);

            telemetryStore.setIsHelpUsImproveEnabled(helpUsImprove);

            vpnStore.setLocationsTab(locationsTab);
            vpnStore.setSavedLocationIds(savedLocationIds);

            if (!isAuthenticated) {
                await authStore.handleInitPolicyAgreement(policyAgreement);
                await authStore.getAuthCacheFromBackground();
                this.setInitStatus(RequestStatus.Done);
                return;
            }

            // set host permissions flag as soon as possible just after the authentication
            // because it is critical for the VPN to work
            settingsStore.setHostPermissionsError(isHostPermissionsGranted);

            if (permissionsError) {
                settingsStore.setGlobalError(permissionsError);
            } else if (!hasRequiredData) {
                settingsStore.setCanControlProxy(canControlProxy);
                settingsStore.setGlobalError(new Error('No required data'));
                this.setInitStatus(RequestStatus.Error);
                return;
            } else {
                settingsStore.setGlobalError(null);
            }

            // retrieve limited offer data after user is authenticated
            // and there is not other errors
            let limitedOfferData = null;
            if (!isPremiumToken) {
                limitedOfferData = await messenger.getLimitedOfferData();
            }

            authStore.setFlagsStorageData(flagsStorageData);
            authStore.setIsFirstRun(isFirstRun);
            authStore.setShouldShowRateModal(shouldShowRateModal);
            authStore.setShowHintPopup(shouldShowHintPopup);
            settingsStore.setCanControlProxy(canControlProxy);
            settingsStore.setConnectivityState(connectivityState);
            settingsStore.setIsRoutable(isRoutable);
            settingsStore.setIsVpnBlocked(isVpnBlocked);
            settingsStore.setShowMobileEdgePromoBanner(shouldShowMobileEdgePromoBanner);
            settingsStore.setLimitedOfferData(limitedOfferData);
            settingsStore.setPromoNotification(promoNotification);
            vpnStore.setVpnInfo(vpnInfo);
            vpnStore.setLocations(locations);
            vpnStore.setSelectedLocation(selectedLocation);
            vpnStore.setIsPremiumToken(isPremiumToken);
            await authStore.getAuthCacheFromBackground();
            await authStore.setPolicyAgreement(policyAgreement);
            await settingsStore.checkRateStatus();
            await settingsStore.getExclusionsInverted();
            await settingsStore.getCurrentTabHostname();
            settingsStore.setIsExcluded(!isVpnEnabledByUrl);

            this.setInitStatus(RequestStatus.Done);
        } catch (e) {
            log.error(e.message);
            this.setInitStatus(RequestStatus.Error);
        }
    }

    /**
     * Retrieves the authentication status from the
     * background and marks the status as retrieved.
     */
    @action
    async initAuthenticatedStatus(): Promise<void> {
        const { authStore } = this.rootStore;

        const isAuthenticated = await messenger.isAuthenticated();
        authStore.setIsAuthenticated(isAuthenticated);
        authStore.setAuthenticatedStatusRetrieved(true);
    }

    @action
    async init(): Promise<void> {
        /**
         * Get android data first because our styles depends on it,
         * and UI might shift because it was loaded too late.
         */
        await this.getAndroidData();

        /**
         * Authentication status should be retrieved from background before
         * popup data is retrieved to prevent flickering of the loaders.
         */
        await this.initAuthenticatedStatus();

        await this.getPopupData(MAX_GET_POPUP_DATA_ATTEMPTS);
        await this.getDesktopAppData();
        await this.rootStore.authStore.getResendCodeCountdownAndStart();
    }

    @action
    setInitStatus(status: RequestStatus): void {
        this.initStatus = status;
    }

    @computed
    get status() {
        return this.initStatus;
    }
}
