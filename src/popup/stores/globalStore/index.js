import {
    action,
    computed,
    observable,
} from 'mobx';

import { REQUEST_STATUSES } from '../consts';

class globalStore {
    @observable initStatus = REQUEST_STATUSES.PENDING;

    constructor(rootStore) {
        this.rootStore = rootStore;
    }

    @action
    async init() {
        const { rootStore: { vpnStore, settingsStore } } = this;

        this.setInitStatus(REQUEST_STATUSES.PENDING);

        try {
            const {
                vpnInfo,
                endpoints,
                selectedEndpoint,
                error,
            } = await adguard.popupData.getPopupData();
            if (error) {
                settingsStore.setGlobalError(error);
            }
            vpnStore.setVpnInfo(vpnInfo);
            vpnStore.setEndpoints(endpoints);
            vpnStore.setSelectedEndpoint(selectedEndpoint);
            this.setInitStatus(REQUEST_STATUSES.DONE);
        } catch (e) {
            this.setInitStatus(REQUEST_STATUSES.ERROR);
        }
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
