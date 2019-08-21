import {
    action,
    observable,
    runInAction,
} from 'mobx';

import tabs from '../../../background/tabs';
import log from '../../../lib/logger';
import bgProvider from '../../../lib/background-provider';
import { SETTINGS_IDS } from '../../../background/settings';

const extensionEnabledSettingId = SETTINGS_IDS.PROXY_ENABLED;

class SettingsStore {
    @observable extensionEnabled = false;

    @observable canControlProxy = false;

    @observable gettingEndpointsState;

    @observable isWhitelisted;

    @observable currentTabUrl;

    @observable proxyStats;

    @observable ping = 0;

    @observable isRoutable = true;

    @action
    setPing = (ping) => {
        this.ping = ping;
    };

    startGettingPing = async () => {
        await bgProvider.stats.setPingCallback(this.setPing);
    };

    stopGettingPing = async () => {
        await bgProvider.stats.setPingCallback(null);
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
        await this.startGettingPing();
    };

    disableExtension = async () => {
        this.extensionEnabled = false;
        await this.stopGettingPing();
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
            .getSetting(extensionEnabledSettingId);
        runInAction(async () => {
            await this.toggleEnabled(globalProxyEnabledSetting.value);
        });
    }

    @action
    async setGlobalProxyEnabled(value) {
        let changed;
        try {
            changed = await bgProvider.settings.setSetting(extensionEnabledSettingId, value);
        } catch (e) {
            log.error(e);
        }
        if (changed) {
            runInAction(async () => {
                await this.toggleEnabled(value);
            });
        }
    }

    @action
    async addToWhitelist() {
        try {
            await bgProvider.whitelist.addToWhitelist(this.currentTabUrl);
            runInAction(() => {
                this.isWhitelisted = true;
            });
        } catch (e) {
            console.log(e);
        }
    }

    @action
    async removeFromWhitelist() {
        try {
            await bgProvider.whitelist.removeFromWhitelist(this.currentTabUrl);
            runInAction(() => {
                this.isWhitelisted = false;
            });
        } catch (e) {
            console.log(e);
        }
    }

    @action async checkIsWhitelisted() {
        try {
            await this.getCurrentTabUrl();
            const result = await bgProvider.whitelist.isWhitelisted(this.currentTabUrl);
            runInAction(() => {
                this.isWhitelisted = result;
            });
        } catch (e) {
            console.log(e);
        }
    }

    @action async getCurrentTabUrl() {
        try {
            const result = await tabs.getCurrent();
            runInAction(() => {
                this.currentTabUrl = result.url;
            });
        } catch (e) {
            console.log(e);
        }
    }

    @action async getProxyStats() {
        try {
            const stats = await bgProvider.provider.getStats();
            runInAction(() => {
                this.proxyStats = stats;
            });
        } catch (e) {
            console.log(e);
        }
    }

    @action isTabRoutable = async () => {
        try {
            const currentTab = await tabs.getCurrent();
            const isRoutable = await bgProvider.tabsContext.isTabRoutable(currentTab.id);
            runInAction(() => {
                this.isRoutable = isRoutable;
            });
        } catch (e) {
            console.log(e);
        }
    }
}

export default SettingsStore;
