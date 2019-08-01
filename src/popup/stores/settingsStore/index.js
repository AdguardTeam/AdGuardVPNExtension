import {
    action,
    observable,
    configure,
    runInAction,
    computed,
} from 'mobx';

import log from '../../../lib/logger';
import background from '../../../lib/background-service';

const extensionEnabledSettingId = 'extensionEnabled';

// Do not allow actions outside of store
configure({ enforceActions: 'observed' });

const REQUEST_STATES = {
    DONE: 'done',
    PENDING: 'pending',
    ERROR: 'error',
};

class SettingsStore {
    @observable extensionEnabled = false;

    @observable canControlProxy = false;

    @observable endpoints = [];

    @observable gettingEndpointsState;

    @observable selectedEndpoint;

    @observable searchValue;

    @observable signedIn = false;

    @observable isWhitelisted;

    @observable currentTabUrl;

    @action
    setSignedIn = (value) => {
        this.signedIn = value;
    };

    @action
    setSearchValue = (value) => {
        // TODO [maximtop] validate value, do not set if equal
        this.searchValue = value;
    };

    @action
    getEndpoints = async () => {
        // TODO [maximtop] consider moving this code into bg page
        this.gettingEndpointsState = REQUEST_STATES.PENDING;
        this.endpoints = [];
        try {
            const provider = await background.getProviderModule();
            const endpoints = await provider.getEndpoints();
            runInAction(() => {
                this.gettingEndpointsState = REQUEST_STATES.DONE;
                this.endpoints = endpoints;
            });
        } catch (e) {
            this.gettingEndpointsState = REQUEST_STATES.ERROR;
            console.log(e);
        }
    };

    @computed
    get filteredEndpoints() {
        const filteredEndpoints = Object.values(this.endpoints).filter((endpoint) => {
            const regex = new RegExp(this.searchValue, 'ig');
            return endpoint.city.match(regex);
        });
        return filteredEndpoints;
    }

    @action
    setSelectedEndpoint = (id) => {
        this.selectedEndpoint = id;
    };

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

    @action
    async addToWhitelist() {
        const whitelist = await background.getWhitelistModule();
        try {
            await whitelist.addToWhitelist(this.currentTabUrl);
            runInAction(() => {
                this.isWhitelisted = true;
            });
        } catch (e) {
            console.log(e);
        }
    }

    @action
    async removeFromWhitelist() {
        const whitelist = await background.getWhitelistModule();
        try {
            await whitelist.removeFromWhitelist(this.currentTabUrl);
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
            const whitelist = await background.getWhitelistModule();
            const result = await whitelist.isWhitelisted(this.currentTabUrl);
            runInAction(() => {
                this.isWhitelisted = result;
            });
        } catch (e) {
            console.log(e);
        }
    }

    @action async getCurrentTabUrl() {
        try {
            const tabs = await background.getTabsModule();
            const result = await tabs.getCurrentTabUrl();
            runInAction(() => {
                this.currentTabUrl = result;
            });
        } catch (e) {
            console.log(e);
        }
    }
}

const settingsStore = new SettingsStore();

export default settingsStore;
