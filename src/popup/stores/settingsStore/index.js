import {
    action, computed,
    observable,
    runInAction,
} from 'mobx';

import tabs from '../../../background/tabs';
import log from '../../../lib/logger';
import { getHostname, formatBytes } from '../../../lib/helpers';
import bgProvider from '../../../lib/background-provider';
import { SETTINGS_IDS } from '../../../lib/constants';

class SettingsStore {
    @observable extensionEnabled = false;

    @observable canControlProxy = false;

    @observable gettingEndpointsState;

    @observable isWhitelisted;

    @observable currentTabHostname;

    @observable proxyStats;

    @observable ping = 0;

    @observable isRoutable = true;

    @observable globalError;

    @action
    setPing = (ping) => {
        this.ping = ping;
    };

    getProxyPing = async () => {
        const ping = await bgProvider.connectivity.getPing();
        this.setPing(ping);
    };

    @action
    async checkProxyControl() {
        const { canControlProxy } = await bgProvider.appManager.getAppStatus();
        runInAction(() => {
            this.canControlProxy = canControlProxy;
        });
    }

    enableExtension = async () => {
        this.extensionEnabled = true;
    };

    disableExtension = async () => {
        this.extensionEnabled = false;
    };

    toggleEnabled = async (value) => {
        if (value) {
            await this.enableExtension();
        } else {
            await this.disableExtension();
        }
    };

    @action
    async getGlobalProxyEnabled() {
        const globalProxyEnabledSetting = await bgProvider.settings
            .getSetting(SETTINGS_IDS.PROXY_ENABLED);
        runInAction(async () => {
            await this.toggleEnabled(globalProxyEnabledSetting.value);
        });
    }

    @action
    setGlobalProxyEnabled = async (value) => {
        let changed;
        try {
            changed = await bgProvider.settings.setSetting(SETTINGS_IDS.PROXY_ENABLED, value);
        } catch (e) {
            log.error(e.message);
        }
        if (changed) {
            runInAction(async () => {
                await this.toggleEnabled(value);
            });
        }
    };

    @action
    addToWhitelist = async () => {
        try {
            await bgProvider.whitelist.addToWhitelist(this.currentTabHostname);
            runInAction(() => {
                this.isWhitelisted = true;
            });
        } catch (e) {
            console.log(e);
        }
    };

    @action
    removeFromWhitelist = async () => {
        try {
            await bgProvider.whitelist.removeFromWhitelist(this.currentTabHostname);
            runInAction(() => {
                this.isWhitelisted = false;
            });
        } catch (e) {
            console.log(e);
        }
    };

    @action
    checkIsWhitelisted = async () => {
        try {
            await this.getCurrentTabHostname();
            const result = await bgProvider.whitelist.isWhitelisted(this.currentTabHostname);
            runInAction(() => {
                this.isWhitelisted = result;
            });
        } catch (e) {
            console.log(e);
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
            console.log(e);
        }
    };

    @action
    getProxyStats = async () => {
        try {
            const stats = await bgProvider.connectivity.getStats();
            runInAction(() => {
                this.proxyStats = stats;
            });
        } catch (e) {
            console.log(e);
        }
    };

    @action
    isTabRoutable = async () => {
        try {
            const currentTab = await tabs.getCurrent();
            const isRoutable = await bgProvider.tabsContext.isTabRoutable(currentTab.id);
            runInAction(() => {
                this.isRoutable = isRoutable;
            });
        } catch (e) {
            console.log(e);
        }
    };

    @computed
    get stats() {
        let { bytesDownloaded, bytesUploaded } = this.proxyStats || {};
        bytesDownloaded = formatBytes(bytesDownloaded);
        bytesUploaded = formatBytes(bytesUploaded);
        return { bytesDownloaded, bytesUploaded };
    }

    @action
    setGlobalError = (data) => {
        this.globalError = data;
    }
}

export default SettingsStore;
