import {
    action,
    observable,
    configure,
    runInAction,
} from 'mobx';

import log from '../../../lib/logger';
import background from '../../../lib/background-service';

const extensionEnabledSettingId = 'extensionEnabled';

// Do not allow actions outside of store
configure({ enforceActions: 'observed' });

class SettingsStore {
    @observable extensionEnabled = false;

    @observable canControlProxy = false;

    async getSettingValue(settingId) {
        const settings = await background.getSettingsModule();
        return settings.getSetting(settingId);
    }

    @action
    async checkProxyControl() {
        const proxy = await background.getProxyModule();
        const { canControlProxy } = await proxy.canControlProxy();
        runInAction(() => {
            this.canControlProxy = canControlProxy;
        });
    }

    @action
    async getGlobalProxyEnabled() {
        const globalProxyEnabledSetting = await this.getSettingValue(extensionEnabledSettingId);
        runInAction(() => {
            this.extensionEnabled = globalProxyEnabledSetting.value;
        });
    }

    async updateSetting(settingId, value) {
        const settings = await background.getSettingsModule();
        return settings.setSetting(settingId, value);
    }

    @action
    async setGlobalProxyEnabled(value) {
        let changed;
        try {
            changed = await this.updateSetting(extensionEnabledSettingId, value);
        } catch (e) {
            log.error(e);
        }
        if (changed) {
            runInAction(() => {
                this.extensionEnabled = value;
            });
        }
    }
}

const settingsStore = new SettingsStore();

export default settingsStore;
