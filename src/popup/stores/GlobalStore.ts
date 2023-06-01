import {
    action,
    computed,
    observable,
} from 'mobx';

import { MAX_GET_POPUP_DATA_ATTEMPTS, RequestStatus } from './consts';
import { log } from '../../lib/logger';
import { tabs } from '../../background/tabs';
import { messenger } from '../../lib/messenger';
import type { RootStore } from './RootStore';
import { browserApi } from '../../background/browserApi';
import { SETTINGS_IDS, SETTINGS_KEY } from '../../lib/constants';
import type { Settings } from '../../background/settings/SettingsService';

export class GlobalStore {
    @observable initStatus = RequestStatus.Pending;

    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @action
    async getPopupData(numberOfTries = 1): Promise<void> {
        const { rootStore: { vpnStore, settingsStore, authStore } } = this;

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
                shouldShowHintPopup,
            } = popupData;

            if (!isAuthenticated) {
                authStore.setIsAuthenticated(isAuthenticated);
                await authStore.handleInitPolicyAgreement(policyAgreement);
                await authStore.getAuthCacheFromBackground();
                this.setInitStatus(RequestStatus.Done);
                return;
            }

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

            authStore.setFlagsStorageData(flagsStorageData);
            authStore.setIsFirstRun(isFirstRun);
            authStore.setUserEmail(username);
            authStore.setShouldShowRateModal(shouldShowRateModal);
            authStore.setShowConfirmEmail(!!vpnInfo?.emailConfirmationRequired);
            authStore.setShowHintPopup(shouldShowHintPopup);
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
            this.setInitStatus(RequestStatus.Done);
        } catch (e) {
            log.error(e.message);
            this.setInitStatus(RequestStatus.Error);
        }
    }

    @action
    async init(): Promise<void> {
        // set appearance theme from browser storage
        // to open popup with proper theme for sure
        await this.setAppearanceThemeFromStorage();
        await this.getPopupData(MAX_GET_POPUP_DATA_ATTEMPTS);
    }

    @action setAppearanceThemeFromStorage = async (): Promise<void> => {
        const settings = <Settings> await browserApi.storage.get(SETTINGS_KEY);
        const appearanceTheme = settings[SETTINGS_IDS.APPEARANCE_THEME];

        const { rootStore: { settingsStore } } = this;
        settingsStore.setAppearanceTheme(appearanceTheme);
    };

    @action
    setInitStatus(status: RequestStatus): void {
        this.initStatus = status;
    }

    @computed
    get status() {
        return this.initStatus;
    }
}
