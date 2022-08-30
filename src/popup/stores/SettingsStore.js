import {
    action,
    computed,
    observable,
    runInAction,
} from 'mobx';

import tabs from '../../background/tabs';
import { log } from '../../lib/logger';
import { MAX_GET_POPUP_DATA_ATTEMPTS, REQUEST_STATUSES } from './consts';
import { SETTINGS_IDS, APPEARANCE_THEME_DEFAULT, AnimationType } from '../../lib/constants';
import { messenger } from '../../lib/messenger';
import { STATE } from '../../background/connectivity/connectivityService/connectivityConstants';
import { getHostname, getProtocol } from '../../common/url-utils';

export class SettingsStore {
    @observable canControlProxy = false;

    @observable isExcluded;

    @observable currentTabHostname;

    @observable isRoutable = true;

    @observable globalError;

    @observable canBeExcluded = true;

    @observable exclusionsInverted;

    @observable checkPermissionsState = REQUEST_STATUSES.DONE;

    @observable connectivityState;

    @observable desktopVpnEnabled;

    @observable isRateVisible;

    @observable freeUserClickedPremiumLocation = false;

    @observable hasLimitExceededDisplayed = false;

    @observable promoNotification = null;

    @observable appearanceTheme = APPEARANCE_THEME_DEFAULT;

    @observable animationType = null;

    constructor(rootStore) {
        this.rootStore = rootStore;
    }

    @action prohibitExclusion = () => {
        this.canBeExcluded = false;
    };

    @action
    async checkProxyControl() {
        const { canControlProxy } = await messenger.getCanControlProxy();
        runInAction(() => {
            this.canControlProxy = canControlProxy;
        });
    }

    @action setCanControlProxy = ({ canControlProxy }) => {
        this.canControlProxy = canControlProxy;
    };

    @action enableProxy = async (force = false) => {
        await messenger.enableProxy(force);
    };

    @action disableProxy = async (force = false) => {
        await messenger.disableProxy(force);
    };

    @action reconnectProxy = async () => {
        await this.disableProxy(true);
        await this.enableProxy(true);
    };

    @action setProxyState = async (value) => {
        if (value) {
            await this.enableProxy(true);
        } else {
            this.setAnimation(AnimationType.SwitchOff);
            await this.disableProxy(true);
        }
    };

    @action disableVpnOnCurrentTab = async () => {
        try {
            await messenger.disableVpnByUrl(this.currentTabHostname);
            if (this.isConnected) {
                this.setAnimation(AnimationType.SwitchOff);
            }
            this.setIsExcluded(true);
        } catch (e) {
            log.error(e);
        }
    };

    @action enableVpnOnCurrentTab = async () => {
        try {
            await messenger.enableVpnByUrl(this.currentTabHostname);
            this.setIsExcluded(false);
            if (this.isConnected) {
                this.setAnimation(AnimationType.SwitchOn);
            }
        } catch (e) {
            log.error(e);
        }
    };

    @action setAnimation = (value) => {
        this.animationType = value;
    };

    @action getExclusionsInverted = async () => {
        const exclusionsInverted = await messenger.getExclusionsInverted();
        runInAction(() => {
            this.exclusionsInverted = exclusionsInverted;
        });
    };

    @action getCurrentTabHostname = async () => {
        try {
            const result = await tabs.getCurrent();
            const { url } = result;
            runInAction(() => {
                const hostname = getHostname(url);
                const protocol = getProtocol(url);
                this.currentTabHostname = hostname;

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

    @action setIsRoutable = (value) => {
        this.isRoutable = value;
    };

    @action
    setGlobalError(data) {
        this.globalError = data;
    }

    @action
    async checkPermissions() {
        this.checkPermissionsState = REQUEST_STATUSES.PENDING;
        try {
            await messenger.checkPermissions();
            await this.rootStore.globalStore.getPopupData(MAX_GET_POPUP_DATA_ATTEMPTS);
        } catch (e) {
            log.info(e.message);
        }
        runInAction(() => {
            this.checkPermissionsState = REQUEST_STATUSES.DONE;
        });
    }

    @action
    async clearPermissionError() {
        this.globalError = null;
        await messenger.clearPermissionsError();
    }

    @computed
    get displayNonRoutable() {
        if (this.exclusionsInverted) {
            return !this.isRoutable && this.isExcluded;
        }
        return !(this.isRoutable || this.isExcluded);
    }

    @action
    async disableOtherProxyExtensions() {
        await messenger.disableOtherExtensions();
        await this.checkProxyControl();
    }

    @computed
    get hasGlobalError() {
        return !!this.globalError;
    }

    @computed
    get hasLimitExceededError() {
        const { vpnStore } = this.rootStore;

        const {
            maxDownloadedBytes = 0,
            usedDownloadedBytes = 0,
        } = vpnStore.vpnInfo;

        if (maxDownloadedBytes === 0) {
            return false;
        }

        return maxDownloadedBytes - usedDownloadedBytes < 0;
    }

    @computed
    get showLimitExceededScreen() {
        return this.hasLimitExceededError && !this.hasLimitExceededDisplayed;
    }

    @action
    setHasLimitExceededDisplayed() {
        this.hasLimitExceededDisplayed = true;
    }

    @action
    setConnectivityState(state) {
        this.connectivityState = state;
    }

    @computed
    get isConnected() {
        return this.connectivityState.value === STATE.CONNECTED;
    }

    @computed
    get isDisconnectedIdle() {
        return this.connectivityState.value === STATE.DISCONNECTED_IDLE;
    }

    @computed
    get isConnectingIdle() {
        return this.connectivityState.value === STATE.CONNECTING_IDLE;
    }

    @computed
    get isDisconnectedRetrying() {
        return this.connectivityState.value === STATE.DISCONNECTED_RETRYING;
    }

    @computed
    get isConnectingRetrying() {
        return this.connectivityState.value === STATE.CONNECTING_RETRYING;
    }

    @action setDesktopVpnEnabled = (status) => {
        this.desktopVpnEnabled = status;
    };

    @action setBackgroundDesktopVpnEnabled = (status) => {
        messenger.setDesktopVpnEnabled(status);
    };

    @action checkRateStatus = async () => {
        const value = await messenger.getSetting(SETTINGS_IDS.RATE_SHOW);
        runInAction(() => {
            this.isRateVisible = value;
        });
    };

    @action hideRate = async () => {
        await messenger.setSetting(SETTINGS_IDS.RATE_SHOW, false);
        runInAction(() => {
            this.isRateVisible = false;
        });
    };

    @action setPremiumLocationClickedByFreeUser = (state) => {
        this.freeUserClickedPremiumLocation = state;
    };

    @action setPromoNotification = (promoNotification) => {
        this.promoNotification = promoNotification;
    };

    @action getAppearanceTheme = async () => {
        const value = await messenger.getSetting(SETTINGS_IDS.APPEARANCE_THEME);
        runInAction(() => {
            this.appearanceTheme = value;
        });
    };

    @action setIsExcluded = (value) => {
        this.isExcluded = value;
    };
}
