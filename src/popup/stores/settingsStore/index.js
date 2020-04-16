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
import messager from '../../../lib/messager';

class SettingsStore {
    @observable switcherEnabled = false;

    @observable proxyEnabled = false;

    @observable proxyEnablingStatus = REQUEST_STATUSES.DONE;

    @observable canControlProxy = false;

    @observable isExcluded;

    @observable currentTabHostname;

    @observable ping = 0;

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
    getProxyPing = async () => {
        const currentEndpointPing = await messager.getCurrentEndpointPing();
        runInAction(() => {
            this.ping = currentEndpointPing;
        });
    };

    @action
    async checkProxyControl() {
        // TODO refactor to return one boolean
        const { canControlProxy } = await messager.getCanControlProxy();
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
    setProxyEnabledStatus(isProxyEnabled) {
        this.proxyEnabled = isProxyEnabled;
        this.setSwitcher(isProxyEnabled);
    }

    @action
    enableProxy = async (force = false, withCancel = false) => {
        this.proxyEnablingStatus = REQUEST_STATUSES.PENDING;
        try {
            this.serverError = false;
            await messager.enableProxy(force, withCancel);
        } catch (e) {
            runInAction(() => {
                this.serverError = true;
            });
            log.error(e);
        }
    };

    @action
    disableProxy = async (force = false, withCancel = false) => {
        this.ping = 0;
        this.proxyEnabled = false;
        await messager.disableProxy(force, withCancel);
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
            await messager.addToExclusions(
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
            await messager.removeFromExclusions(this.currentTabHostname);
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
            const result = await messager.getIsExcluded(this.currentTabHostname);
            runInAction(() => {
                this.isExcluded = result;
            });
        } catch (e) {
            log.error(e);
        }
    };

    @action
    areExclusionsInverted = () => {
        this.exclusionsInverted = adguard.exclusions.isInverted();
        return this.exclusionsInverted;
    };

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
            await adguard.permissionsChecker.checkPermissions();
            await this.rootStore.globalStore.getPopupData(MAX_GET_POPUP_DATA_ATTEMPTS);
        } catch (e) {
            log.info(e.message);
        }
        runInAction(() => {
            this.checkPermissionsState = REQUEST_STATUSES.DONE;
        });
    }

    @action clearPermissionError() {
        this.globalError = null;
        adguard.permissionsError.clearError();
    }

    @computed
    get displayNonRoutable() {
        if (this.areExclusionsInverted()) {
            return !this.isRoutable && this.isExcluded;
        }
        return !(this.isRoutable || this.isExcluded);
    }

    @action
    async disableOtherProxyExtensions() {
        await messager.disableOtherExtensions();
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
