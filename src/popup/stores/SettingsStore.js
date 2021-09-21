import {
    action,
    computed,
    observable,
    runInAction,
} from 'mobx';

import tabs from '../../background/tabs';
import { log } from '../../lib/logger';
import { getHostname, getProtocol } from '../../lib/helpers';
import { MAX_GET_POPUP_DATA_ATTEMPTS, REQUEST_STATUSES } from './consts';
import { SETTINGS_IDS, PROMO_SCREEN_STATES, APPEARANCE_THEME_DEFAULT } from '../../lib/constants';
import messenger from '../../lib/messenger';
import { STATE } from '../../background/connectivity/connectivityService/connectivityConstants';

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

    @observable onboardingSlide = 1;

    @observable promoScreenState = PROMO_SCREEN_STATES.DISPLAY_AFTER_CONNECT_CLICK;

    @observable freeUserClickedPremiumLocation = false;

    @observable hasLimitExceededDisplayed = false;

    @observable promoNotification = null;

    @observable appearanceTheme = APPEARANCE_THEME_DEFAULT;

    constructor(rootStore) {
        this.rootStore = rootStore;
    }

    @action
    prohibitExclusion = () => {
        this.canBeExcluded = false;
    };

    @action
    async checkProxyControl() {
        const { canControlProxy } = await messenger.getCanControlProxy();
        runInAction(() => {
            this.canControlProxy = canControlProxy;
        });
    }

    @action
    setCanControlProxy = ({ canControlProxy }) => {
        this.canControlProxy = canControlProxy;
    };

    @action
    enableProxy = async (force = false) => {
        await messenger.enableProxy(force);
    };

    @action
    disableProxy = async (force = false) => {
        await messenger.disableProxy(force);
    };

    @action
    reconnectProxy = async () => {
        await this.disableProxy(true);
        await this.enableProxy(true);
    };

    @action
    setProxyState = async (value) => {
        if (value) {
            await this.enableProxy(true);
        } else {
            await this.disableProxy(true);
        }
    };

    @action
    addToExclusions = async () => {
        try {
            await messenger.addToExclusions(
                this.currentTabHostname,
                true,
                { considerWildcard: false },
            );
            runInAction(() => {
                this.isExcluded = true;
            });
        } catch (e) {
            log.error(e);
        }
    };

    @action
    removeFromExclusions = async () => {
        try {
            await messenger.removeFromExclusions(this.currentTabHostname);
            runInAction(() => {
                this.isExcluded = false;
            });
        } catch (e) {
            log.error(e);
        }
    };

    @action
    checkIsExcluded = async () => {
        try {
            await this.getCurrentTabHostname();
            const result = await messenger.getIsExcluded(this.currentTabHostname);
            runInAction(() => {
                this.isExcluded = result;
            });
        } catch (e) {
            log.error(e);
        }
    };

    @action
    getExclusionsInverted = async () => {
        const exclusionsInverted = await messenger.getExclusionsInverted();
        runInAction(() => {
            this.exclusionsInverted = exclusionsInverted;
        });
    }

    @action
    getCurrentTabHostname = async () => {
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

    @action
    setIsRoutable = (value) => {
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
    get showLimitExceededScreen() {
        const { vpnStore } = this.rootStore;

        const {
            maxDownloadedBytes = 0,
            usedDownloadedBytes = 0,
        } = vpnStore.vpnInfo;

        if (maxDownloadedBytes === 0) {
            return false;
        }

        const hasLimitExceeded = maxDownloadedBytes - usedDownloadedBytes < 0;
        return hasLimitExceeded && !this.hasLimitExceededDisplayed;
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

    @action
    setDesktopVpnEnabled = (status) => {
        this.desktopVpnEnabled = status;
    }

    @action
    setBackgroundDesktopVpnEnabled = (status) => {
        messenger.setDesktopVpnEnabled(status);
    }

    @action
    checkRateStatus = async () => {
        const value = await messenger.getSetting(SETTINGS_IDS.RATE_SHOW);
        runInAction(() => {
            this.isRateVisible = value;
        });
    };

    @action
    hideRate = async () => {
        await messenger.setSetting(SETTINGS_IDS.RATE_SHOW, false);
        runInAction(() => {
            this.isRateVisible = false;
        });
    };

    @action
    handleNextSlide = (value) => {
        runInAction(() => {
            this.onboardingSlide = value;
        });
    };

    @action
    setSalePromoStatus = async (state) => {
        await messenger.setSetting(SETTINGS_IDS.SALE_SHOW, state);
        runInAction(() => {
            this.promoScreenState = state;
        });
    }

    @action
    getPromoScreenStatus = async () => {
        const value = await messenger.getSetting(SETTINGS_IDS.SALE_SHOW);
        runInAction(() => {
            this.promoScreenState = value;
        });
    };

    @computed
    get displayExclusionScreen() {
        return (this.isExcluded && !this.exclusionsInverted)
        || (!this.isExcluded && this.exclusionsInverted);
    }

    @action
    setPremiumLocationClickedByFreeUser = (state) => {
        this.freeUserClickedPremiumLocation = state;
    }

    @action
    setPromoNotification = (promoNotification) => {
        this.promoNotification = promoNotification;
    }

    @action
    getAppearanceTheme = async () => {
        const value = await messenger.getSetting(SETTINGS_IDS.APPEARANCE_THEME);
        runInAction(() => {
            this.appearanceTheme = value;
        });
    };
}
