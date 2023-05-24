import {
    action,
    computed,
    observable,
    runInAction,
} from 'mobx';

import { tabs } from '../../background/tabs';
import { log } from '../../lib/logger';
import { MAX_GET_POPUP_DATA_ATTEMPTS, RequestStatus } from './consts';
import {
    SETTINGS_IDS,
    APPEARANCE_THEME_DEFAULT,
    AppearanceTheme,
    AnimationEvent,
    AnimationState,
} from '../../lib/constants';
import { messenger } from '../../lib/messenger';
import { ConnectivityStateType } from '../../background/schema';
import { getHostname, getProtocol } from '../../common/url-utils';
import { animationService } from '../components/Settings/BackgroundAnimation/animationStateMachine';
import { PromoNotificationData } from '../../background/promoNotifications';
import type { RootStore } from './RootStore';

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

    @observable connectivityState: StateType;

    @observable desktopVpnEnabled: boolean;

    @observable isRateVisible: boolean;

    @observable freeUserClickedPremiumLocation: boolean = false;

    @observable hasLimitExceededDisplayed: boolean = false;

    @observable promoNotification: PromoNotificationData | null = null;

    @observable appearanceTheme = APPEARANCE_THEME_DEFAULT;

    @observable darkThemeMediaQuery: MediaQueryList;

    @observable systemTheme: AppearanceTheme;

    @observable animationState: AnimationState = <AnimationState>animationService.initialState.value;

    @observable showServerErrorPopup: boolean = false;

    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @action prohibitExclusion = () => {
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
            log.error(e);
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
            log.error(e);
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
            log.error(e);
        }
    };

    @action setIsRoutable = (value: boolean): void => {
        this.isRoutable = value;
    };

    @action setGlobalError(data: Error | null) {
        this.globalError = data;
    }

    @action async checkPermissions(): Promise<void> {
        this.checkPermissionsState = RequestStatus.Pending;
        try {
            await messenger.checkPermissions();
            await this.rootStore.globalStore.getPopupData(MAX_GET_POPUP_DATA_ATTEMPTS);
        } catch (e) {
            log.info(e.message);
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

        if (vpnStore.vpnInfo.maxDownloadedBytes) {
            maxDownloadedBytes = vpnStore.vpnInfo.maxDownloadedBytes;
        }

        if (vpnStore.vpnInfo.usedDownloadedBytes) {
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

    @action setConnectivityState(state: StateType) {
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

    @action setDesktopVpnEnabled = (status: boolean): void => {
        this.desktopVpnEnabled = status;
    };

    @action setBackgroundDesktopVpnEnabled = (status: boolean): void => {
        messenger.setDesktopVpnEnabled(status);
    };

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

    @action setPremiumLocationClickedByFreeUser = (state: boolean): void => {
        this.freeUserClickedPremiumLocation = state;
    };

    @action setPromoNotification = (promoNotification: PromoNotificationData): void => {
        this.promoNotification = promoNotification;
    };

    @action getAppearanceTheme = async (): Promise<void> => {
        const value = await messenger.getSetting(SETTINGS_IDS.APPEARANCE_THEME);
        runInAction(() => {
            this.appearanceTheme = value;
        });
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
        if (state.value === ConnectivityStateType.Connected) {
            animationService.send(AnimationEvent.VpnConnected);
            return;
        }
        if (state.value === ConnectivityStateType.DisconnectedIdle) {
            animationService.send(AnimationEvent.VpnDisconnected);
            return;
        }
        if (state.value === ConnectivityStateType.DisconnectedRetrying) {
            animationService.send(AnimationEvent.VpnDisconnectedRetrying);
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
}
