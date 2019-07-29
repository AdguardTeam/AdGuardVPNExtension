import {
    action,
    observable,
    configure,
    runInAction,
} from 'mobx';
import log from '../../../lib/logger';
import background from '../../../lib/background-service';

const globalProxyEnabledId = 'globalProxyEnabled';

// Do not allow actions outside of store
configure({ enforceActions: 'observed' });

class SettingsStore {
    @observable globalProxyEnabled = false;

    async getSettingValue(settingId) {
        const settings = await background.getSettingsModule();
        return settings.getSetting(settingId);
    }

    @action
    async getGlobalProxyEnabled() {
        const globalProxyEnabledSetting = await this.getSettingValue(globalProxyEnabledId);
        runInAction(() => {
            this.globalProxyEnabled = globalProxyEnabledSetting.value;
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
            changed = await this.updateSetting(globalProxyEnabledId, value);
        } catch (e) {
            log.error(e);
        }
        if (changed) {
            runInAction(() => {
                this.globalProxyEnabled = value;
            });
        }
    }
}

const settingsStore = new SettingsStore();

export default settingsStore;
