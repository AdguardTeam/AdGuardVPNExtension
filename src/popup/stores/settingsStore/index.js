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
import { ERROR_STATUSES } from '../../../lib/constants';
import messenger from '../../../lib/messenger';
import { STATE } from '../../../background/connectivity/connectivityService/connectivityConstants';

class SettingsStore {
    // TODO remove
    @observable proxyEnabled = false;

    @observable canControlProxy = false;

    @observable isExcluded;

    @observable currentTabHostname;

    @observable isRoutable = true;

    @observable globalError;

    @observable canBeExcluded = true;

    @observable exclusionsInverted;

    @observable checkPermissionsState = REQUEST_STATUSES.DONE;

    @observable connectivityState;

    @action
    prohibitExclusion = () => {
        this.canBeExcluded = false;
    };


    constructor(rootStore) {
        this.rootStore = rootStore;
    }

    @action
    async checkProxyControl() {
        // TODO refactor to return one boolean
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
    enableProxy = async (force = false, withCancel = false) => {
        await messenger.enableProxy(force, withCancel);
    };

    @action
    disableProxy = async (force = false, withCancel = false) => {
        this.proxyEnabled = false;
        await messenger.disableProxy(force, withCancel);
    };

    @action
    reconnectProxy = async () => {
        await this.disableProxy(true);
        await this.enableProxy(true);
    };

    @action
    setProxyState = async (value) => {
        if (value) {
            await this.enableProxy(true, true);
        } else {
            await this.disableProxy(true, true);
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
        return this.connectivityState.value === 'connectingRetrying'; // TODO export state from constants
    }
}

export default SettingsStore;
