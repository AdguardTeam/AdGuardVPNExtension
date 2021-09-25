import {
    action,
    computed,
    observable,
} from 'mobx';

import { REQUEST_STATUSES } from './consts';
import { log } from '../../lib/logger';

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
            await settingsStore.getAppearanceTheme();
            await authStore.isAuthenticated();
            await settingsStore.getExclusions();
            await settingsStore.getVersion();
            await settingsStore.getUsername();
            await settingsStore.checkRateStatus();
            await settingsStore.getWebRTCValue();
            await settingsStore.getContextMenusEnabled();
            await settingsStore.getHelpUsImprove();
            await settingsStore.getDnsServer();
            await settingsStore.updateReferralData();
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
