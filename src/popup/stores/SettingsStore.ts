import {
    action,
    computed,
    observable,
    runInAction,
} from 'mobx';

import { tabs } from '../../common/tabs';
import { log } from '../../common/logger';
import { SETTINGS_IDS, AppearanceTheme } from '../../common/constants';
import { messenger } from '../../common/messenger';
import { ConnectivityStateType } from '../../background/schema';
import { getHostname, getProtocol } from '../../common/utils/url';
import { animationService } from '../components/Settings/BackgroundAnimation/animationStateMachine';
import { type LimitedOfferData } from '../../background/limitedOfferService';
import { type PromoNotificationData } from '../../background/promoNotifications';
import { Prefs } from '../../common/prefs';
import { getThemeFromLocalStorage } from '../../common/useAppearanceTheme';
import { AnimationEvent, type AnimationState } from '../constants';

import type { RootStore } from './RootStore';
import { MAX_GET_POPUP_DATA_ATTEMPTS, RECALCULATE_PINGS_BTN_INACTIVITY_DELAY_MS, RequestStatus } from './constants';

type StateType = {
    value: string,
};

export class SettingsStore {
    @observable canControlProxy: boolean = true;

    @observable isCurrentTabExcluded: boolean;

    @observable currentTabHostname: string;

    @observable isRoutable: boolean = true;

    @observable globalError: Error | null;

    @observable canBeExcluded: boolean = true;

    @observable exclusionsInverted: boolean;

    @observable checkPermissionsState = RequestStatus.Done;

    @observable connectivityState: StateType = { value: ConnectivityStateType.Idle };

    @observable isRateVisible: boolean;

    @observable isMobileEdgePromoBannerVisible: boolean;

    @observable freeUserClickedPremiumLocation: boolean = false;

    @observable hasLimitExceededDisplayed: boolean = false;

    @observable promoNotification: PromoNotificationData | null = null;

    @observable appearanceTheme: AppearanceTheme;

    @observable darkThemeMediaQuery: MediaQueryList;

    @observable systemTheme: AppearanceTheme = this.getSystemTheme();

    @observable animationState: AnimationState = <AnimationState>animationService.initialState.value;

    @observable showServerErrorPopup: boolean = false;

    @observable isVpnBlocked: boolean = false;

    @observable isHostPermissionsGranted: boolean = false;

    @observable limitedOfferData: LimitedOfferData | null = null;

    @observable limitedOfferTimer?: ReturnType<typeof setInterval>;

    @observable hasDesktopAppForOs: boolean = false;

    @observable isAndroidBrowser: boolean = false;

    @observable isFirefoxAndroid: boolean | null = null;

    @observable arePingsRecalculating: boolean = false;

    @observable forwarderDomain: string;

    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @action prohibitExclusion = (): void => {
        this.canBeExcluded = false;
    };

    @action
    async checkProxyControl(): Promise<void> {
        const { canControlProxy } = await messenger.getCanControlProxy();
        runInAction(() => {
            this.canControlProxy = canControlProxy;
        });
    }

    @action setCanControlProxy = ({ canControlProxy }: { canControlProxy: boolean }): void => {
        this.canControlProxy = canControlProxy;
    };

    @action enableProxy = async (force = false): Promise<void> => {
        await messenger.enableProxy(force);
    };

    @action disableProxy = async (force = false): Promise<void> => {
        await messenger.disableProxy(force);
    };

    @action reconnectProxy = async (): Promise<void> => {
        await this.disableProxy(true);
        await this.enableProxy(true);
    };

    @action setProxyState = async (value: boolean): Promise<void> => {
        if (value) {
            await this.enableProxy(true);
        } else {
            await this.disableProxy(true);
        }
    };

    @action disableVpnOnCurrentTab = async (): Promise<void> => {
        try {
            await messenger.disableVpnByUrl(this.currentTabHostname);
            this.setIsExcluded(true);
            // play disconnection animation,
            // if user connected to any location and added website to exclusions
            if (this.isConnected) {
                animationService.send(AnimationEvent.VpnDisconnected);
            }
        } catch (e) {
            log.error('[vpn.SettingsStore]: ', e);
        }
    };

    @action enableVpnOnCurrentTab = async (): Promise<void> => {
        try {
            await messenger.enableVpnByUrl(this.currentTabHostname);
            this.setIsExcluded(false);
            // play connection animation,
            // if user connected to any location and removed website from exclusions
            if (this.isConnected) {
                animationService.send(AnimationEvent.VpnConnected);
            }
        } catch (e) {
            log.error('[vpn.SettingsStore]: ', e);
        }
    };

    @action getExclusionsInverted = async (): Promise<void> => {
        const exclusionsInverted = await messenger.getExclusionsInverted();
        runInAction(() => {
            this.exclusionsInverted = exclusionsInverted;
        });
    };

    @action getCurrentTabHostname = async (): Promise<void> => {
        try {
            const result = await tabs.getCurrent();
            const { url } = result;
            runInAction(() => {
                const hostname = getHostname(url);
                const protocol = getProtocol(url);
                if (hostname) {
                    this.currentTabHostname = hostname;
                }

                switch (protocol) {
                    case 'https:':
                        break;
                    case 'http:':
                        break;
                    default:
                        this.prohibitExclusion();
                }
            });
        } catch (e) {
            log.error('[vpn.SettingsStore]: ', e);
        }
    };

    @action setIsRoutable = (value: boolean): void => {
        this.isRoutable = value;
    };

    @action setGlobalError(data: Error | null): void {
        this.globalError = data;
    }

    @action async checkPermissions(): Promise<void> {
        this.checkPermissionsState = RequestStatus.Pending;
        try {
            await messenger.checkPermissions();
            await this.rootStore.globalStore.getPopupData(MAX_GET_POPUP_DATA_ATTEMPTS);
        } catch (e) {
            log.info('[vpn.SettingsStore.checkPermissions]: ', e.message);
        }
        runInAction(() => {
            this.checkPermissionsState = RequestStatus.Done;
        });
    }

    @action async clearPermissionError(): Promise<void> {
        this.globalError = null;
        await messenger.clearPermissionsError();
    }

    @computed
    get displayNonRoutable(): boolean {
        if (this.exclusionsInverted) {
            return !this.isRoutable && this.isCurrentTabExcluded;
        }
        return !(this.isRoutable || this.isCurrentTabExcluded);
    }

    @action async disableOtherProxyExtensions(): Promise<void> {
        await messenger.disableOtherExtensions();
        await this.checkProxyControl();
    }

    @computed
    get hasGlobalError(): boolean {
        return !!this.globalError;
    }

    @computed
    get hasLimitExceededError(): boolean {
        const { vpnStore } = this.rootStore;

        let maxDownloadedBytes = 0;
        let usedDownloadedBytes = 0;

        if (vpnStore.vpnInfo?.maxDownloadedBytes && vpnStore.vpnInfo?.usedDownloadedBytes) {
            maxDownloadedBytes = vpnStore.vpnInfo.maxDownloadedBytes;
            usedDownloadedBytes = vpnStore.vpnInfo.usedDownloadedBytes;
        }

        if (maxDownloadedBytes === 0) {
            return false;
        }

        return maxDownloadedBytes - usedDownloadedBytes < 0;
    }

    @computed
    get showLimitExceededScreen(): boolean {
        return this.hasLimitExceededError && !this.hasLimitExceededDisplayed;
    }

    @action setHasLimitExceededDisplayed(): void {
        this.hasLimitExceededDisplayed = true;
    }

    @action setConnectivityState(state: StateType): void {
        this.connectivityState = state;
        this.updateAnimationState(state);
    }

    @computed
    get isIdle(): boolean {
        return this.connectivityState.value === ConnectivityStateType.Idle;
    }

    @computed
    get isConnected(): boolean {
        return this.connectivityState.value === ConnectivityStateType.Connected;
    }

    @computed
    get isDisconnectedIdle(): boolean {
        return this.connectivityState.value === ConnectivityStateType.DisconnectedIdle;
    }

    @computed
    get isConnectingIdle(): boolean {
        return this.connectivityState.value === ConnectivityStateType.ConnectingIdle;
    }

    @computed
    get isDisconnectedRetrying(): boolean {
        return this.connectivityState.value === ConnectivityStateType.DisconnectedRetrying;
    }

    @computed
    get isConnectingRetrying(): boolean {
        return this.connectivityState.value === ConnectivityStateType.ConnectingRetrying;
    }

    @action checkRateStatus = async (): Promise<void> => {
        const value = await messenger.getSetting(SETTINGS_IDS.RATE_SHOW);
        runInAction(() => {
            this.isRateVisible = value;
        });
    };

    @action hideRate = async (): Promise<void> => {
        await messenger.setSetting(SETTINGS_IDS.RATE_SHOW, false);
        runInAction(() => {
            this.isRateVisible = false;
        });
    };

    @action hideMobileEdgePromoBanner = async (): Promise<void> => {
        await messenger.hideMobileEdgePromoBanner();
        runInAction(() => {
            this.isMobileEdgePromoBannerVisible = false;
        });
    };

    @action setPremiumLocationClickedByFreeUser = (state: boolean): void => {
        this.freeUserClickedPremiumLocation = state;
    };

    @action setPromoNotification = (promoNotification: PromoNotificationData): void => {
        this.promoNotification = promoNotification;
    };

    @action getAppearanceTheme = async (): Promise<void> => {
        let appearanceTheme = <AppearanceTheme>getThemeFromLocalStorage();
        if (appearanceTheme) {
            this.setAppearanceTheme(appearanceTheme);
            return;
        }

        appearanceTheme = await messenger.getSetting(SETTINGS_IDS.APPEARANCE_THEME);
        runInAction(() => {
            this.appearanceTheme = appearanceTheme;
        });
    };

    @action setAppearanceTheme = (value: AppearanceTheme): void => {
        this.appearanceTheme = value;
    };

    @action setIsExcluded = (value: boolean): void => {
        this.isCurrentTabExcluded = value;
    };

    @action updateDarkThemeMediaQuery = (): void => {
        this.darkThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    };

    @action updateSystemTheme = (): void => {
        this.systemTheme = this.darkThemeMediaQuery.matches
            ? AppearanceTheme.Dark
            : AppearanceTheme.Light;
    };

    getSystemTheme(): AppearanceTheme.Dark | AppearanceTheme.Light {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
            ? AppearanceTheme.Dark
            : AppearanceTheme.Light;
    }

    @action trackSystemTheme = (): void => {
        this.updateDarkThemeMediaQuery();
        this.updateSystemTheme();
        this.darkThemeMediaQuery.addEventListener('change', this.updateSystemTheme);
    };

    @action stopTrackSystemTheme = (): void => {
        this.darkThemeMediaQuery.removeEventListener('change', this.updateSystemTheme);
    };

    @action setAnimationState = (value: AnimationState): void => {
        this.animationState = value;
    };

    @action updateAnimationState = (state: StateType): void => {
        switch (state.value) {
            case ConnectivityStateType.Connected: {
                animationService.send(AnimationEvent.VpnConnected);
                break;
            }
            case ConnectivityStateType.DisconnectedIdle: {
                animationService.send(AnimationEvent.VpnDisconnected);
                break;
            }
            case ConnectivityStateType.DisconnectedRetrying: {
                animationService.send(AnimationEvent.VpnDisconnectedRetrying);
                break;
            }
            default:
                animationService.send(AnimationEvent.VpnDisconnected);
        }
    };

    handleAnimationEnd = (): void => {
        animationService.send(AnimationEvent.AnimationEnded);
    };

    @action openServerErrorPopup = (): void => {
        this.showServerErrorPopup = true;
    };

    @action closeServerErrorPopup = (): void => {
        this.showServerErrorPopup = false;
    };

    @computed
    get showNotificationModal(): boolean {
        if (!this.promoNotification) {
            return false;
        }

        const { url, text } = this.promoNotification;

        if (!url || !text) {
            return false;
        }

        return true;
    }

    @action setIsVpnBlocked = (value: boolean): void => {
        this.isVpnBlocked = value;
    };

    @action setShowMobileEdgePromoBanner(value: boolean): void {
        this.isMobileEdgePromoBannerVisible = value;
    }

    @action setHostPermissionsError = (value: boolean): void => {
        this.isHostPermissionsGranted = value;
    };

    /**
     * Sets value to {@link limitedOfferData} and starts countdown timer if value is not null.
     */
    @action setLimitedOfferData = (value: LimitedOfferData | null): void => {
        this.limitedOfferData = value;
        if (value) {
            this.startCountdown();
        }
    };

    /**
     * Checks whether the limited offer should be displayed.
     */
    @computed
    get isLimitedOfferActive(): boolean {
        return !!this.limitedOfferData;
    }

    /**
     * Starts countdown timer based on store's value {@link limitedOfferData.timeLeftMs}.
     */
    @action startCountdown = (): void => {
        this.limitedOfferTimer = setInterval(() => {
            runInAction(() => {
                if (this.limitedOfferData?.timeLeftMs === 0) {
                    clearInterval(this.limitedOfferTimer);
                    return;
                }
                if (this.limitedOfferData) {
                    this.limitedOfferData.timeLeftMs -= 1000;
                }
            });
        }, 1000);
    };

    /**
     * Checks whether the desktop AdGuard VPN apps are supported for the current OS.
     * Sets the result to {@link hasDesktopAppForOs}.
     */
    @action async setHasDesktopAppForOs(): Promise<void> {
        const isWindows = await Prefs.isWindows();
        const isMacOS = await Prefs.isMacOS();
        runInAction(() => {
            this.hasDesktopAppForOs = isWindows || isMacOS;
        });
    }

    /**
     * Checks whether the extension is running on a android browser.
     * Sets the result to {@link isAndroidBrowser}
     */
    @action async setIsAndroidBrowser(): Promise<void> {
        const isAndroid = await Prefs.isAndroid();
        runInAction(() => {
            this.isAndroidBrowser = isAndroid;
        });
    }

    /**
     * Checks whether the extension is running on Firefox Android.
     * Sets the result to {@link isFirefoxAndroid}
     */
    @action async setIsFirefoxAndroid(): Promise<void> {
        const isFirefoxAndroid = await Prefs.isFirefoxAndroid();
        runInAction(() => {
            this.isFirefoxAndroid = isFirefoxAndroid;
        });
    }

    /**
     * Sets the {@link arePingsRecalculating} to the specified value.
     *
     * @param value Value to set.
     */
    @action setArePingsRecalculating(value: boolean): void {
        this.arePingsRecalculating = value;
    }

    /**
     * Sets the {@link arePingsRecalculating} to true,
     * and re-calculates the pings for all locations.
     *
     * After the pings are re-calculated, sets the {@link arePingsRecalculating} to false.
     */
    @action async recalculatePings(): Promise<void> {
        this.setArePingsRecalculating(true);
        // set the fastest locations to the cached value to avoid showing the skeleton
        this.rootStore.vpnStore.setCachedFastestLocations();

        await messenger.recalculatePings();

        setTimeout(() => {
            this.setArePingsRecalculating(false);
            // reset the fastest locations to display the actual locations
            this.rootStore.vpnStore.resetCachedFastestLocations();
        }, RECALCULATE_PINGS_BTN_INACTIVITY_DELAY_MS);
    }

    /**
     * Sets the forwarder domain to the specified value.
     *
     * @param value Value to set.
     */
    @action setForwarderDomain(value: string): void {
        this.forwarderDomain = value;
    }
}
