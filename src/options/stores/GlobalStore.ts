import { action, computed, observable } from 'mobx';

import { log } from '../../common/logger';
import { messenger } from '../../common/messenger';
import { i18n } from '../../common/i18n';

import { RequestStatus } from './consts';
import type { RootStore } from './RootStore';

export class GlobalStore {
    @observable public initStatus = RequestStatus.Pending;

    private rootStore: RootStore;

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
    public async getOptionsData(isDataRefresh = false): Promise<void> {
        const { rootStore } = this;
        const {
            settingsStore,
            authStore,
            profilesStore,
            telemetryStore,
        } = rootStore;

        if (!isDataRefresh) {
            this.setInitStatus(RequestStatus.Pending);
        }

        try {
            const optionsData = await messenger.getOptionsData(isDataRefresh);
            await i18n.init(optionsData.selectedLanguage);
            settingsStore.setOptionsData(optionsData);
            await settingsStore.requestIsPremiumToken();
            authStore.setIsAuthenticated(optionsData.isAuthenticated);
            if (optionsData.maxDevicesCount !== undefined) {
                authStore.setMaxDevicesCount(optionsData.maxDevicesCount);
            }
            telemetryStore.setIsHelpUsImproveEnabled(optionsData.helpUsImprove);
            profilesStore.setProfilesData(optionsData.profilesData);
            if (!isDataRefresh) {
                telemetryStore.setPageId(optionsData.pageId);
            }

            this.setInitStatus(RequestStatus.Done);
        } catch (e) {
            log.error('[vpn.GlobalStore.getOptionsData]: ', e.message);
            this.setInitStatus(RequestStatus.Error);
        }
    }

    @action
    public async init(): Promise<void> {
        await this.getOptionsData();
    }

    @action
    private setInitStatus(status: RequestStatus): void {
        this.initStatus = status;
    }

    @computed
    public get status(): RequestStatus {
        return this.initStatus;
    }
}
