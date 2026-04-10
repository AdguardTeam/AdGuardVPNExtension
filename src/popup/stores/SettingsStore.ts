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
    @observable public canControlProxy: boolean = true;

    @observable public isCurrentTabExcluded: boolean;

    @observable public currentTabHostname: string;

    @observable private isRoutable: boolean = true;

    @observable private globalError: Error | null;

    @observable public canBeExcluded: boolean = true;

    @observable private exclusionsInverted: boolean;

    @observable public checkPermissionsState = RequestStatus.Done;

    @observable private connectivityState: StateType = { value: ConnectivityStateType.Idle };

    @observable public isRateVisible: boolean;

    @observable public isMobileEdgePromoBannerVisible: boolean;

    @observable private freeUserClickedPremiumLocation: boolean = false;

    @observable private hasLimitExceededDisplayed: boolean = false;

    @observable public promoNotification: PromoNotificationData | null = null;

    @observable public appearanceTheme: AppearanceTheme;

    @observable private darkThemeMediaQuery: MediaQueryList;

    @observable public systemTheme: AppearanceTheme = this.getSystemTheme();

    @observable public animationState: AnimationState = <AnimationState>animationService.initialState.value;

    @observable public showServerErrorPopup: boolean = false;

    @observable public isVpnBlocked: boolean = false;

    @observable public isHostPermissionsGranted: boolean = false;

    @observable public limitedOfferData: LimitedOfferData | null = null;

    @observable private limitedOfferTimer?: ReturnType<typeof setInterval>;

    @observable public hasDesktopAppForOs: boolean = false;

    @observable public isAndroidBrowser: boolean = false;

    @observable public isLinux: boolean = false;

    @observable public isFirefox: boolean | null = null;

    @observable public arePingsRecalculating: boolean = false;

    @observable public forwarderDomain: string;

    private rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @action private prohibitExclusion = (): void => {
        this.canBeExcluded = false;
    };

    @action
    private async checkProxyControl(): Promise<void> {
        const { canControlProxy } = await messenger.getCanControlProxy();
        runInAction(() => {
            this.canControlProxy = canControlProxy;
        });
    }

    @action public setCanControlProxy = ({ canControlProxy }: { canControlProxy: boolean }): void => {
        this.canControlProxy = canControlProxy;
    };

    @action private enableProxy = async (force = false): Promise<void> => {
        await messenger.enableProxy(force);
    };

    @action public disableProxy = async (force = false): Promise<void> => {
        await messenger.disableProxy(force);
    };

    @action public reconnectProxy = async (): Promise<void> => {
        await this.disableProxy(true);
        await this.enableProxy(true);
    };

    @action public setProxyState = async (value: boolean): Promise<void> => {
        if (value) {
            await this.enableProxy(true);
        } else {
            await this.disableProxy(true);
        }
    };

    @action public disableVpnOnCurrentTab = async (): Promise<void> => {
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

    @action public enableVpnOnCurrentTab = async (): Promise<void> => {
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

    @action public getExclusionsInverted = async (): Promise<void> => {
        const exclusionsInverted = await messenger.getExclusionsInverted();
        runInAction(() => {
            this.exclusionsInverted = exclusionsInverted;
        });
    };

    @action public getCurrentTabHostname = async (): Promise<void> => {
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

    @action public setIsRoutable = (value: boolean): void => {
        this.isRoutable = value;
    };

    @action public setGlobalError(data: Error | null): void {
        this.globalError = data;
    }

    @action public async checkPermissions(): Promise<void> {
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

    @action private async clearPermissionError(): Promise<void> {
        this.globalError = null;
        await messenger.clearPermissionsError();
    }

    @computed
    public get displayNonRoutable(): boolean {
        if (this.exclusionsInverted) {
            return !this.isRoutable && this.isCurrentTabExcluded;
        }
        return !(this.isRoutable || this.isCurrentTabExcluded);
    }

    @action public async disableOtherProxyExtensions(): Promise<void> {
        await messenger.disableOtherExtensions();
        await this.checkProxyControl();
    }

    @computed
    public get hasGlobalError(): boolean {
        return !!this.globalError;
    }

    @computed
    public get hasLimitExceededError(): boolean {
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
    public get showLimitExceededScreen(): boolean {
        return this.hasLimitExceededError && !this.hasLimitExceededDisplayed;
    }

    @action public setHasLimitExceededDisplayed(): void {
        this.hasLimitExceededDisplayed = true;
    }

    @action public setConnectivityState(state: StateType): void {
        this.connectivityState = state;
        this.updateAnimationState(state);
    }

    @computed
    public get isIdle(): boolean {
        return this.connectivityState.value === ConnectivityStateType.Idle;
    }

    @computed
    public get isConnected(): boolean {
        return this.connectivityState.value === ConnectivityStateType.Connected;
    }

    @computed
    public get isDisconnectedIdle(): boolean {
        return this.connectivityState.value === ConnectivityStateType.DisconnectedIdle;
    }

    @computed
    public get isConnectingIdle(): boolean {
        return this.connectivityState.value === ConnectivityStateType.ConnectingIdle;
    }

    @computed
    public get isDisconnectedRetrying(): boolean {
        return this.connectivityState.value === ConnectivityStateType.DisconnectedRetrying;
    }

    @computed
    public get isConnectingRetrying(): boolean {
        return this.connectivityState.value === ConnectivityStateType.ConnectingRetrying;
    }

    @action public checkRateStatus = async (): Promise<void> => {
        const value = await messenger.getSetting(SETTINGS_IDS.RATE_SHOW);
        runInAction(() => {
            this.isRateVisible = value;
        });
    };

    @action public hideRate = async (): Promise<void> => {
        await messenger.setSetting(SETTINGS_IDS.RATE_SHOW, false);
        runInAction(() => {
            this.isRateVisible = false;
        });
    };

    @action public hideMobileEdgePromoBanner = async (): Promise<void> => {
        await messenger.hideMobileEdgePromoBanner();
        runInAction(() => {
            this.isMobileEdgePromoBannerVisible = false;
        });
    };

    @action public setPremiumLocationClickedByFreeUser = (state: boolean): void => {
        this.freeUserClickedPremiumLocation = state;
    };

    @action public setPromoNotification = (promoNotification: PromoNotificationData): void => {
        this.promoNotification = promoNotification;
    };

    /**
     * Close the promo notification modal
     */
    @action public onClosePromoNotification = async (): Promise<void> => {
        this.promoNotification = null;
        await messenger.setNotificationViewed(false);
    };

    @action public getAppearanceTheme = async (): Promise<void> => {
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

    @action public setAppearanceTheme = (value: AppearanceTheme): void => {
        this.appearanceTheme = value;
    };

    @action public setIsExcluded = (value: boolean): void => {
        this.isCurrentTabExcluded = value;
    };

    @action private updateDarkThemeMediaQuery = (): void => {
        this.darkThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    };

    @action private updateSystemTheme = (): void => {
        this.systemTheme = this.darkThemeMediaQuery.matches
            ? AppearanceTheme.Dark
            : AppearanceTheme.Light;
    };

    private getSystemTheme(): AppearanceTheme.Dark | AppearanceTheme.Light {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
            ? AppearanceTheme.Dark
            : AppearanceTheme.Light;
    }

    @action public trackSystemTheme = (): void => {
        this.updateDarkThemeMediaQuery();
        this.updateSystemTheme();
        this.darkThemeMediaQuery.addEventListener('change', this.updateSystemTheme);
    };

    @action public stopTrackSystemTheme = (): void => {
        this.darkThemeMediaQuery.removeEventListener('change', this.updateSystemTheme);
    };

    @action public setAnimationState = (value: AnimationState): void => {
        this.animationState = value;
    };

    @action private updateAnimationState = (state: StateType): void => {
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

    public handleAnimationEnd = (): void => {
        animationService.send(AnimationEvent.AnimationEnded);
    };

    @action public openServerErrorPopup = (): void => {
        this.showServerErrorPopup = true;
    };

    @action public closeServerErrorPopup = (): void => {
        this.showServerErrorPopup = false;
    };

    @computed
    public get showNotificationModal(): boolean {
        if (!this.promoNotification) {
            return false;
        }

        const { url, text } = this.promoNotification;

        if (!url || !text) {
            return false;
        }

        return true;
    }

    @action public setIsVpnBlocked = (value: boolean): void => {
        this.isVpnBlocked = value;
    };

    @action public setShowMobileEdgePromoBanner(value: boolean): void {
        this.isMobileEdgePromoBannerVisible = value;
    }

    @action public setHostPermissionsError = (value: boolean): void => {
        this.isHostPermissionsGranted = value;
    };

    /**
     * Sets value to {@link limitedOfferData} and starts countdown timer if value is not null.
     */
    @action public setLimitedOfferData = (value: LimitedOfferData | null): void => {
        this.limitedOfferData = value;
        if (value) {
            this.startCountdown();
        }
    };

    /**
     * Checks whether the limited offer should be displayed.
     */
    @computed
    public get isLimitedOfferActive(): boolean {
        return !!this.limitedOfferData;
    }

    /**
     * Starts countdown timer based on store's value {@link limitedOfferData.timeLeftMs}.
     */
    @action private startCountdown = (): void => {
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
    @action public async setHasDesktopAppForOs(): Promise<void> {
        const isWindows = await Prefs.isWindows();
        const isMacOS = await Prefs.isMacOS();
        runInAction(() => {
            this.hasDesktopAppForOs = isWindows || isMacOS;
        });
    }

    /**
     * Checks whether the extension is running on Linux.
     * Sets the result to {@link isLinux}.
     */
    @action public async setIsLinux(): Promise<void> {
        const isLinux = await Prefs.isLinux();
        runInAction(() => {
            this.isLinux = isLinux;
        });
    }

    /**
     * Checks whether the extension is running on a android browser.
     * Sets the result to {@link isAndroidBrowser}
     */
    @action public async setIsAndroidBrowser(): Promise<void> {
        const isAndroid = await Prefs.isAndroid();
        runInAction(() => {
            this.isAndroidBrowser = isAndroid;
        });
    }

    /**
     * Checks whether the extension is running on Firefox (any platform).
     * Sets the result to {@link isFirefox}
     */
    @action public setIsFirefox(): void {
        this.isFirefox = Prefs.isFirefox();
    }

    /**
     * Sets the {@link arePingsRecalculating} to the specified value.
     *
     * @param value Value to set.
     */
    @action private setArePingsRecalculating(value: boolean): void {
        this.arePingsRecalculating = value;
    }

    /**
     * Sets the {@link arePingsRecalculating} to true,
     * and refreshes locations from the server.
     *
     * After the locations are refreshed, sets the {@link arePingsRecalculating} to false.
     */
    @action public async refreshLocations(): Promise<void> {
        this.setArePingsRecalculating(true);
        // set the fastest locations to the cached value to avoid showing the skeleton
        this.rootStore.vpnStore.setCachedFastestLocations();

        await messenger.refreshLocations();

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
    @action public setForwarderDomain(value: string): void {
        this.forwarderDomain = value;
    }
}
