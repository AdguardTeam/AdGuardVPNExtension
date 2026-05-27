import { action, computed, observable } from 'mobx';

import { log } from '../../common/logger';
import { tabs } from '../../common/tabs';
import { messenger } from '../../common/messenger';
import { i18n } from '../../common/i18n';
import { type PopupDataRetry, type AuthenticatedPopupDataRetry } from '../../background/popupData/popupDataTypes';

import type { RootStore } from './RootStore';
import { MAX_GET_POPUP_DATA_ATTEMPTS, RequestStatus } from './constants';

/**
 * Narrows popup data to the authenticated variant where all
 * authenticated-only fields are guaranteed to be present.
 *
 * @param data Popup data to check.
 * @returns Whether the data contains authenticated user data.
 */
function isAuthenticatedPopupData(
    data: PopupDataRetry,
): data is AuthenticatedPopupDataRetry {
    return !!data.isAuthenticated;
}

export class GlobalStore {
    @observable public initStatus = RequestStatus.Pending;

    @observable private startupDataRetrieved = false;

    private rootStore: RootStore;

    /**
     * Cached promise for popup data loading.
     * Used to start loading popup data in the background during onboarding
     * and await the same promise later when the machine reaches loadingPopupData.
     */
    private popupDataPromise: Promise<void> | null = null;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    /**
     * Checks whether the desktop AdGuard VPN apps are supported for the current OS.
     * Sets the result to the settings store.
     */
    @action
    public async getDesktopAppData(): Promise<void> {
        const { rootStore: { settingsStore } } = this;
        await settingsStore.setHasDesktopAppForOs();
        await settingsStore.setIsLinux();
    }

    /**
     * Checks whether the extension is running on an Android browser.
     * Sets the result to the settings store.
     */
    @action
    public async getAndroidData(): Promise<void> {
        const { rootStore: { settingsStore } } = this;
        await settingsStore.setIsAndroidBrowser();
    }

    /**
     * Retrieves the authentication status from the
     * background and marks the status as retrieved.
     *
     * @returns Whether the user is authenticated.
     */
    @action
    public async initAuthenticatedStatus(): Promise<boolean> {
        const { authStore } = this.rootStore;

        const isAuthenticated = await messenger.isAuthenticated();
        authStore.setIsAuthenticated(isAuthenticated);
        authStore.setAuthenticatedStatusRetrieved(true);

        return isAuthenticated;
    }

    /**
     * Gets all required data for onboarding and showing upgrade screen and sets it to stores.
     *
     * @returns Whether onboarding should be shown.
     */
    @action
    public async initStartupData(): Promise<boolean> {
        const { rootStore } = this;
        const {
            authStore,
            vpnStore,
            settingsStore,
        } = rootStore;
        const {
            isFirstRun,
            flagsStorageData,
            marketingConsent,
            isPremiumToken,
            selectedLanguage,
        } = await messenger.getStartupData();

        await i18n.init(selectedLanguage);
        settingsStore.setIsFirefox();
        authStore.setIsFirstRun(isFirstRun);
        authStore.setFlagsStorageData(flagsStorageData);
        await authStore.setMarketingConsent(marketingConsent || false);
        vpnStore.setIsPremiumToken(isPremiumToken);
        this.setStartupDataRetrieved(true);

        // Return whether any onboarding screen needs to be shown
        return authStore.renderNewsletter
            || authStore.renderOnboarding
            || (!isPremiumToken && authStore.renderUpgradeScreen);
    }

    /**
     * Initializes statistics store.
     * Should be called before getPopupData because statistics range
     * is used in the popup data request.
     */
    @action
    public async initStats(): Promise<void> {
        await this.rootStore.statsStore.init();
    }

    /**
     * Starts loading popup data in the background without awaiting the result.
     * Called when entering onboarding so that data loads while the user
     * goes through onboarding screens.
     */
    public startPopupDataPreload(): void {
        if (!this.popupDataPromise) {
            this.popupDataPromise = this.loadAllPopupData();
        }
    }

    /**
     * Awaits popup data, reusing any in-progress preload if one exists.
     * If no preload was started, kicks off a fresh load.
     */
    public async awaitPopupData(): Promise<void> {
        if (!this.popupDataPromise) {
            this.popupDataPromise = this.loadAllPopupData();
        }
        await this.popupDataPromise;
    }

    /**
     * Loads all popup data: stats, popup data, desktop app data.
     * Used internally by preload and await methods.
     * Clears the cached promise on failure so subsequent retries start a fresh load.
     *
     * @returns Promise that resolves when all popup data is loaded.
     */
    private async loadAllPopupData(): Promise<void> {
        try {
            await this.initStats();
            await this.getPopupData(MAX_GET_POPUP_DATA_ATTEMPTS);
            await this.getDesktopAppData();
        } catch (e) {
            this.popupDataPromise = null;
            throw e;
        }
    }

    @action
    public async getPopupData(numberOfTries = 1): Promise<void> {
        const { rootStore } = this;
        const {
            vpnStore,
            settingsStore,
            authStore,
            telemetryStore,
            uiStore,
        } = rootStore;

        this.setInitStatus(RequestStatus.Pending);

        // Used tab api because calling tab api from background returns wrong result
        const tab = await tabs.getCurrent();
        const url = tab.url || null;

        try {
            const popupData = await messenger.getPopupData(url, numberOfTries);

            settingsStore.setForwarderDomain(popupData.forwarderDomain);
            telemetryStore.setIsHelpUsImproveEnabled(popupData.helpUsImprove);
            vpnStore.setLocationsTab(popupData.locationsTab);
            vpnStore.setSavedLocationIds(popupData.savedLocationIds);

            if (!isAuthenticatedPopupData(popupData)) {
                await authStore.getAuthCacheFromBackground();
                this.setInitStatus(RequestStatus.Done);
                return;
            }

            const {
                vpnInfo,
                locations,
                selectedLocation,
                permissionsError,
                canControlProxy,
                isRoutable,
                hasRequiredData,
                isPremiumToken,
                connectivityState,
                promoNotification,
                policyAgreement,
                isFirstRun,
                flagsStorageData,
                isVpnEnabledByUrl,
                shouldShowRateModal,
                shouldShowHintPopup,
                shouldShowMobileEdgePromoBanner,
                isVpnBlocked,
                isHostPermissionsGranted,
                username,
                marketingConsent,
                shouldShowRegionNotice,
                experimentVariants,
                activeProfileId,
                profiles,
            } = popupData;

            // set host permissions flag as soon as possible just after the authentication
            // because it is critical for the VPN to work
            settingsStore.setHostPermissionsError(isHostPermissionsGranted);

            if (permissionsError) {
                settingsStore.setGlobalError(new Error(permissionsError.message));
            } else if (!hasRequiredData) {
                settingsStore.setCanControlProxy(canControlProxy);
                const noDataError = new Error('No required data');
                settingsStore.setGlobalError(noDataError);
                this.setInitStatus(RequestStatus.Error);
                throw noDataError;
            } else {
                settingsStore.setGlobalError(null);
            }

            // retrieve limited offer data after user is authenticated
            // and there is not other errors
            let limitedOfferData = null;
            if (!isPremiumToken) {
                limitedOfferData = await messenger.getLimitedOfferData();
            }

            authStore.setUsername(username);
            authStore.setFlagsStorageData(flagsStorageData);
            authStore.setIsFirstRun(isFirstRun);
            authStore.setShouldShowRateModal(shouldShowRateModal);
            authStore.setShowHintPopup(shouldShowHintPopup);
            authStore.setMarketingConsent(marketingConsent ?? false);
            settingsStore.setCanControlProxy(canControlProxy);
            settingsStore.setConnectivityState(connectivityState);
            settingsStore.setIsRoutable(isRoutable);
            settingsStore.setIsVpnBlocked(isVpnBlocked);
            settingsStore.setShowMobileEdgePromoBanner(shouldShowMobileEdgePromoBanner);
            uiStore.setShouldShowRegionNotice(shouldShowRegionNotice);
            settingsStore.setLimitedOfferData(limitedOfferData);
            if (promoNotification) {
                settingsStore.setPromoNotification(promoNotification);
            }
            if (vpnInfo) {
                vpnStore.setVpnInfo(vpnInfo);
            }
            vpnStore.setLocations(locations.map((loc) => ({ ...loc, selected: false })));
            if (selectedLocation) {
                vpnStore.setSelectedLocation({ ...selectedLocation, selected: true });
            }
            vpnStore.setIsPremiumToken(isPremiumToken);
            vpnStore.setProfiles(profiles);
            vpnStore.setInitialSwitchingProfile(activeProfileId, popupData.switchingProfileId);
            await authStore.getAuthCacheFromBackground();
            await authStore.setPolicyAgreement(policyAgreement);
            await settingsStore.checkRateStatus();
            await settingsStore.getExclusionsInverted(activeProfileId);
            await settingsStore.getCurrentTabHostname();
            settingsStore.setIsExcluded(!isVpnEnabledByUrl);
            uiStore.setExperimentVariants(experimentVariants);

            this.setInitStatus(RequestStatus.Done);
        } catch (e) {
            log.error('[vpn.GlobalStore.getPopupData]: ', e.message);
            this.setInitStatus(RequestStatus.Error);
            throw e;
        }
    }

    @action
    private setInitStatus(status: RequestStatus): void {
        this.initStatus = status;
    }

    @computed
    public get status(): RequestStatus {
        return this.initStatus;
    }

    @action
    private setStartupDataRetrieved(isRetrieved: boolean): void {
        this.startupDataRetrieved = isRetrieved;
    }

    @computed
    public get isStartupDataRetrieved(): boolean {
        return this.startupDataRetrieved;
    }
}
