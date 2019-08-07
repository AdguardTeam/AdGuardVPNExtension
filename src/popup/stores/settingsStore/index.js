import {
    action,
    observable,
    configure,
    runInAction,
    computed,
} from 'mobx';

import log from '../../../lib/logger';
import bgProvider from '../../../lib/background-provider';
import { SETTINGS_IDS } from '../../../background/settings';

const extensionEnabledSettingId = SETTINGS_IDS.PROXY_ENABLED;

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

    @observable searchValue = '';

    @observable isWhitelisted;

    @observable currentTabUrl;

    @observable proxyStats;

    @action
    setSearchValue = (value) => {
        const trimmed = value.trim();
        if (trimmed !== this.searchValue) {
            this.searchValue = value;
        }
    };

    @action
    getEndpoints = async () => {
        // TODO [maximtop] consider moving this code into bg page
        this.gettingEndpointsState = REQUEST_STATES.PENDING;
        this.endpoints = [];
        try {
            const endpoints = await bgProvider.provider.getEndpoints();
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
            if (this.searchValue.length === 0) {
                return true;
            }
            const regex = new RegExp(this.searchValue, 'ig');
            return endpoint.cityName.match(regex);
        });
        return filteredEndpoints;
    }

    @action
    setSelectedEndpoint = (id) => {
        this.selectedEndpoint = id;
        console.log(this.selectedEndpoint);
    };

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
            console.log(stats);
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
