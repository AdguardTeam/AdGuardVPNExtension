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
import { ERROR_STATUSES, FORCE_CANCELLED } from '../../../lib/constants';
import messenger from '../../../lib/messenger';

class SettingsStore {
    @observable switcherEnabled = false;

    @observable proxyEnabled = false;

    @observable proxyEnablingStatus = REQUEST_STATUSES.DONE;

    @observable canControlProxy = false;

    @observable isExcluded;

    @observable currentTabHostname;

    @observable isRoutable = true;

    @observable globalError;

    @observable canBeExcluded = true;

    @observable exclusionsInverted;

    @observable switcherIgnoreProxyStateChange = false;

    @observable checkPermissionsState = REQUEST_STATUSES.DONE;

    @observable serverError = false;

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
    enableSwitcher = () => {
        this.switcherEnabled = true;
    };

    @action
    disableSwitcher = () => {
        this.switcherEnabled = false;
    };

    setSwitcher = (value) => {
        if (this.switcherIgnoreProxyStateChange) {
            return;
        }
        if (this.switcherEnabled !== value) {
            if (value) {
                this.enableSwitcher();
            } else {
                this.disableSwitcher();
            }
        }
    };

    @action
    enableProxy = async (force = false, withCancel = false) => {
        this.proxyEnablingStatus = REQUEST_STATUSES.PENDING;

        this.serverError = false;

        try {
            await messenger.enableProxy(force, withCancel);
        } catch (e) {
            log.error(e);
            const errorMessage = e?.message;
            if (errorMessage === FORCE_CANCELLED) {
                return;
            }
            runInAction(() => {
                this.serverError = true;
            });
        }
    };

    @action
    disableProxy = async (force = false, withCancel = false) => {
        this.proxyEnabled = false;
        await messenger.disableProxy(force, withCancel);
    };

    @action
    reconnectProxy = async () => {
        this.setSwitcherIgnoreProxyStateChange(true);
        await this.disableProxy(true);
        await this.enableProxy(true);
        this.setSwitcherIgnoreProxyStateChange(false);
    };

    @action
    setProxyEnabled = (value) => {
        this.proxyEnabled = value;
        if (!this.switcherIgnoreProxyStateChange) {
            this.proxyEnablingStatus = REQUEST_STATUSES.DONE;
        }
    };

    @action
    setProxyState = async (value) => {
        this.setSwitcher(value);
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

    @computed
    get proxyIsEnabling() {
        return this.proxyEnablingStatus === REQUEST_STATUSES.PENDING;
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

    @computed
    get displayEnabled() {
        return this.switcherEnabled && this.proxyEnabled;
    }

    @action
    setSwitcherIgnoreProxyStateChange(value) {
        this.switcherIgnoreProxyStateChange = value;
    }
}

export default SettingsStore;
