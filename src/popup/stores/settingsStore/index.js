import {
    action,
    computed,
    observable,
    runInAction,
} from 'mobx';

import tabs from '../../../background/tabs';
import log from '../../../lib/logger';
import { getHostname, getProtocol } from '../../../lib/helpers';
import { MAX_GET_POPUP_DATA_ATTEMPTS, REQUEST_STATUSES } from '../consts';
import { ERROR_STATUSES, SETTINGS_IDS, PROMO_SALE_STATUSES } from '../../../lib/constants';
import messenger from '../../../lib/messenger';
import { STATE } from '../../../background/connectivity/connectivityService/connectivityConstants';

class SettingsStore {
    @observable canControlProxy = false;

    @observable isExcluded;

    @observable currentTabHostname;

    @observable isRoutable = true;

    @observable globalError;

    @observable canBeExcluded = true;

    @observable exclusionsInverted;

    @observable checkPermissionsState = REQUEST_STATUSES.DONE;

    @observable connectivityState;

    @observable isRateVisible;

    @observable saleVisibleState = PROMO_SALE_STATUSES.DISPLAY_BEFORE_CLICK;

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
                { considerWildcard: false }
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
    get hasLimitExceededError() {
        return this.globalError && this.globalError.status === ERROR_STATUSES.LIMIT_EXCEEDED;
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
    setSalePromoStatus = async (state) => {
        await messenger.setSetting(SETTINGS_IDS.SALE_SHOW, state);
        runInAction(() => {
            this.saleVisibleState = state;
        });
    }

    @action
    checkSaleStatus = async () => {
        const value = await messenger.getSetting(SETTINGS_IDS.SALE_SHOW);
        runInAction(() => {
            this.saleVisibleState = value;
        });
    };
}

export default SettingsStore;
