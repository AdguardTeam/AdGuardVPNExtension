import {
    action,
    computed,
    observable,
} from 'mobx';

import { RequestStatus } from './consts';
import { log } from '../../lib/logger';
import { messenger } from '../../lib/messenger';

export class GlobalStore {
    @observable initStatus = RequestStatus.Pending;

    constructor(rootStore) {
        this.rootStore = rootStore;
    }

    @action
    async getOptionsData() {
        const { rootStore: { settingsStore, authStore, exclusionsStore } } = this;
        this.setInitStatus(RequestStatus.Pending);

        try {
            const optionsData = await messenger.getOptionsData();
            settingsStore.setOptionsData(optionsData);
            await settingsStore.requestIsPremiumToken();
            authStore.setIsAuthenticated(optionsData.isAuthenticated);
            authStore.setMaxDevicesCount(optionsData.maxDevicesCount);
            exclusionsStore.setServicesData(optionsData.servicesData);
            exclusionsStore.setExclusionsData(optionsData.exclusionsData);
            exclusionsStore.setIsAllExclusionsListsEmpty(optionsData.isAllExclusionsListsEmpty);
            this.setInitStatus(RequestStatus.Done);
        } catch (e) {
            log.error(e.message);
            this.setInitStatus(RequestStatus.Error);
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
