import {
    action,
    computed,
    observable,
} from 'mobx';

import { REQUEST_STATUSES } from '../consts';
import log from '../../../lib/logger';

class globalStore {
    @observable initStatus = REQUEST_STATUSES.PENDING;

    constructor(rootStore) {
        this.rootStore = rootStore;
    }

    @action
    async getPopupData(retryNum = 1) {
        const { rootStore: { vpnStore, settingsStore, authStore } } = this;

        this.setInitStatus(REQUEST_STATUSES.PENDING);

        try {
            let popupData;

            if (retryNum > 1) {
                popupData = await adguard.popupData.getPopupDataRetry(retryNum);
            } else {
                popupData = await adguard.popupData.getPopupData();
            }

            const {
                vpnInfo,
                endpoints,
                selectedEndpoint,
                permissionsError,
                isAuthenticated,
            } = popupData;

            if (!isAuthenticated) {
                authStore.setIsAuthenticated(isAuthenticated);
                this.setInitStatus(REQUEST_STATUSES.DONE);
                return;
            }

            if (permissionsError) {
                settingsStore.setGlobalError(permissionsError);
            }

            authStore.setIsAuthenticated(isAuthenticated);
            vpnStore.setVpnInfo(vpnInfo);
            vpnStore.setEndpoints(endpoints);
            vpnStore.setSelectedEndpoint(selectedEndpoint);
            this.setInitStatus(REQUEST_STATUSES.DONE);
        } catch (e) {
            log.error(e.message);
            this.setInitStatus(REQUEST_STATUSES.ERROR);
        }
    }

    @action
    async init() {
        await this.getPopupData(10);
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

export default globalStore;
