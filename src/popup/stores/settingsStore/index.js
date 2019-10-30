import {
    action,
    computed,
    observable,
    runInAction,
} from 'mobx';

import tabs from '../../../background/tabs';
import log from '../../../lib/logger';
import { getHostname, formatBytes } from '../../../lib/helpers';
import { SETTINGS_IDS } from '../../../lib/constants';
import { REQUEST_STATUSES } from '../consts';

class SettingsStore {
    @observable switcherEnabled = false;

    @observable proxyEnabled = false;

    @observable proxyEnablingStatus = REQUEST_STATUSES.DONE;

    @observable canControlProxy = false;

    @observable gettingEndpointsState;

    @observable isWhitelisted;

    @observable currentTabHostname;

    @observable proxyStats;

    @observable ping = 0;

    @observable isRoutable = true;

    @observable globalError;

    @action
    getProxyPing = () => {
        this.ping = adguard.connectivity.getPing();
    };

    @action
    async checkProxyControl() {
        const { canControlProxy } = await adguard.appStatus.canControlProxy();
        runInAction(() => {
            this.canControlProxy = canControlProxy;
        });
    }

    @action
    enableSwitcher = () => {
        this.switcherEnabled = true;
    };

    @action
    disableSwitcher = () => {
        this.switcherEnabled = false;
    };

    toggleSwitcher = (value) => {
        if (value) {
            this.enableSwitcher();
        } else {
            this.disableSwitcher();
        }
    };

    @action
    async getGlobalProxyEnabled() {
        const { value } = adguard.settings.getSetting(SETTINGS_IDS.PROXY_ENABLED);
        runInAction(() => {
            this.proxyEnabled = value;
            this.toggleSwitcher(value);
        });
    }

    @action
    enableProxy = async () => {
        const flag = true;
        this.proxyEnablingStatus = REQUEST_STATUSES.PENDING;
        const changed = await adguard.settings.setSetting(SETTINGS_IDS.PROXY_ENABLED, flag);
        runInAction(() => {
            this.proxyEnablingStatus = REQUEST_STATUSES.DONE;
        });
        if (changed) {
            this.getProxyPing();
            await this.getProxyStats();
            runInAction(() => {
                this.proxyEnabled = flag;
            });
        }
        return changed;
    };

    @action
    disableProxy = async () => {
        const flag = false;
        const changed = await adguard.settings.setSetting(SETTINGS_IDS.PROXY_ENABLED, flag);
        runInAction(() => {
            this.proxyEnabled = flag;
        });
        return changed;
    };

    @action
    setProxyEnabled = (value) => {
        this.proxyEnabled = value;
    };

    @action
    setProxyState = async (value) => {
        let changed;
        this.toggleSwitcher(value);
        try {
            if (value) {
                changed = await this.enableProxy();
            } else {
                changed = await this.disableProxy();
            }
        } catch (e) {
            log.error(e.message);
            this.toggleSwitcher(!value);
        }
        if (!changed) {
            this.toggleSwitcher(!value);
        }
    };

    @action
    addToWhitelist = async () => {
        try {
            await adguard.whitelist.addToWhitelist(this.currentTabHostname);
            runInAction(() => {
                this.isWhitelisted = true;
            });
        } catch (e) {
            log.error(e);
        }
    };

    @action
    removeFromWhitelist = async () => {
        try {
            await adguard.whitelist.removeFromWhitelist(this.currentTabHostname);
            runInAction(() => {
                this.isWhitelisted = false;
            });
        } catch (e) {
            log.error(e);
        }
    };

    @action
    checkIsWhitelisted = async () => {
        try {
            await this.getCurrentTabHostname();
            const result = adguard.whitelist.isWhitelisted(this.currentTabHostname);
            runInAction(() => {
                this.isWhitelisted = result;
            });
        } catch (e) {
            log.error(e);
        }
    };

    @action
    getCurrentTabHostname = async () => {
        try {
            const result = await tabs.getCurrent();
            runInAction(() => {
                this.currentTabHostname = getHostname(result.url);
            });
        } catch (e) {
            log.error(e);
        }
    };

    @action
    getProxyStats = async () => {
        const stats = await adguard.connectivity.getStats();
        runInAction(() => {
            this.proxyStats = stats;
        });
    };

    @action
    isTabRoutable = async () => {
        try {
            const currentTab = await tabs.getCurrent();
            const isRoutable = adguard.tabsContext.isTabRoutable(currentTab.id);
            runInAction(() => {
                this.isRoutable = isRoutable;
            });
        } catch (e) {
            log.error(e);
        }
    };

    @computed
    get stats() {
        let { bytesDownloaded, bytesUploaded } = this.proxyEnabled ? this.proxyStats || {} : {};
        bytesDownloaded = formatBytes(bytesDownloaded);
        bytesUploaded = formatBytes(bytesUploaded);
        return { bytesDownloaded, bytesUploaded };
    }

    @action
    setGlobalError = (data) => {
        this.globalError = data;
    }

    @computed
    get proxyIsEnabling() {
        return this.proxyEnablingStatus === REQUEST_STATUSES.PENDING;
    }
}

export default SettingsStore;
