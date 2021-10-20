import {
    action,
    computed,
    observable,
} from 'mobx';

import { REQUEST_STATUSES } from './consts';
import { log } from '../../lib/logger';
import messenger from '../../lib/messenger';

export class GlobalStore {
    @observable initStatus = REQUEST_STATUSES.PENDING;

    constructor(rootStore) {
        this.rootStore = rootStore;
    }

    @action
    async getOptionsData() {
        const { rootStore: { settingsStore, authStore } } = this;
        this.setInitStatus(REQUEST_STATUSES.PENDING);

        try {
            const optionsData = await messenger.getOptionsData();
            settingsStore.setOptionsData(optionsData);
            authStore.setIsAuthenticated(optionsData.isAuthenticated);
            authStore.setIsPremiumToken(optionsData.isPremiumToken);
            this.setInitStatus(REQUEST_STATUSES.DONE);
        } catch (e) {
            log.error(e.message);
            this.setInitStatus(REQUEST_STATUSES.ERROR);
        }
    }

    @action
    async init() {
        await this.getOptionsData();
    }

    @action
    setInitStatus(status) {
        this.initStatus = status;
    }

    @computed
    get status() {
        return this.initStatus;
    }
}
