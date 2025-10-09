import { action, computed, observable } from 'mobx';

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

    /**
     * Fetches options data from the background script.
     *
     * @param isDataRefresh If `true`, skips certain first-time initialization steps.
     * Use this when refreshing the data without needing to reset some store values,
     * like `initStatus`, `pageId`.
     */
    @action
    async getOptionsData(isDataRefresh = false): Promise<void> {
        const { rootStore } = this;
        const {
            settingsStore,
            authStore,
            exclusionsStore,
            telemetryStore,
        } = rootStore;

        if (!isDataRefresh) {
            this.setInitStatus(RequestStatus.Pending);
        }

        try {
            const optionsData = await messenger.getOptionsData(isDataRefresh);
            settingsStore.setOptionsData(optionsData);
            await settingsStore.requestIsPremiumToken();
            authStore.setIsAuthenticated(optionsData.isAuthenticated);
            if (optionsData.maxDevicesCount !== undefined) {
                authStore.setMaxDevicesCount(optionsData.maxDevicesCount);
            }
            exclusionsStore.setServicesData(optionsData.servicesData);
            exclusionsStore.setExclusionsData(optionsData.exclusionsData);
            exclusionsStore.setIsAllExclusionsListsEmpty(optionsData.isAllExclusionsListsEmpty);
            telemetryStore.setIsHelpUsImproveEnabled(optionsData.helpUsImprove);
            if (!isDataRefresh) {
                telemetryStore.setPageId(optionsData.pageId);
            }

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
