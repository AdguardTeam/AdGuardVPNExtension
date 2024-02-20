import {
    action,
    computed,
    observable,
} from 'mobx';

import { log } from '../../common/logger';
import { messenger } from '../../common/messenger';

import { RequestStatus } from './consts';
import type { RootStore } from './RootStore';

export class GlobalStore {
    @observable initStatus = RequestStatus.Pending;

    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @action
    async getOptionsData(reloading = false): Promise<void> {
        const { rootStore: { settingsStore, authStore, exclusionsStore } } = this;

        if (!reloading) {
            this.setInitStatus(RequestStatus.Pending);
        }

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
    async init(): Promise<void> {
        await this.getOptionsData();
    }

    @action
    setInitStatus(status: RequestStatus): void {
        this.initStatus = status;
    }

    @computed
    get status(): RequestStatus {
        return this.initStatus;
    }
}
