import {
    action,
    observable,
    configure,
    runInAction,
} from 'mobx';

import log from '../../../lib/logger';
import bgProvider from '../../../lib/background-provider';
import { SETTINGS_IDS } from '../../../background/settings';

const extensionEnabledSettingId = SETTINGS_IDS.PROXY_ENABLED;

// Do not allow property change outside of store actions
configure({ enforceActions: 'observed' });

class SettingsStore {
    @observable extensionEnabled = false;

    @observable canControlProxy = false;

    @observable gettingEndpointsState;

    @observable isWhitelisted;

    @observable currentTabUrl;

    @observable proxyStats;

    @action
    async checkProxyControl() {
        const { canControlProxy } = await bgProvider.proxy.canControlProxy();
        runInAction(() => {
            this.canControlProxy = canControlProxy;
        });
    }

    @action
    async getGlobalProxyEnabled() {
        const globalProxyEnabledSetting = await bgProvider.settings
            .getSetting(extensionEnabledSettingId);
        runInAction(() => {
            this.extensionEnabled = globalProxyEnabledSetting.value;
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
            runInAction(() => {
                this.extensionEnabled = value;
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
            const result = await bgProvider.tabs.getCurrentTabUrl();
            runInAction(() => {
                this.currentTabUrl = result;
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
}

const settingsStore = new SettingsStore();

export default settingsStore;
