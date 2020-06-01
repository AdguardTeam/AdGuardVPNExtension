import {
    action,
    computed,
    observable,
} from 'mobx';

import { MAX_GET_POPUP_DATA_ATTEMPTS, REQUEST_STATUSES } from '../consts';
import log from '../../../lib/logger';
import tabs from '../../../background/tabs';
import messenger from '../../../lib/messenger';

class globalStore {
    @observable initStatus = REQUEST_STATUSES.PENDING;

    constructor(rootStore) {
        this.rootStore = rootStore;
    }

    @action
    async getPopupData(numberOfTries = 1) {
        const { rootStore: { vpnStore, settingsStore, authStore } } = this;

        this.setInitStatus(REQUEST_STATUSES.PENDING);

        // Used tab api because calling tab api from background returns wrong result
        const tab = await tabs.getCurrent();

        try {
            const popupData = await messenger.getPopupData(tab.url, numberOfTries);

            const {
                vpnInfo,
                endpointsList,
                selectedEndpoint,
                permissionsError,
                isAuthenticated,
                canControlProxy,
                isProxyEnabled,
                isConnectivityWorking,
                isRoutable,
                hasRequiredData,
                isPremiumToken,
            } = popupData;

            if (!isAuthenticated) {
                authStore.setIsAuthenticated(isAuthenticated);
                this.setInitStatus(REQUEST_STATUSES.DONE);
                return;
            }

            if (permissionsError) {
                settingsStore.setGlobalError(permissionsError);
            } else if (!hasRequiredData) {
                settingsStore.setGlobalError(new Error('No required data'));
            }

            authStore.setIsAuthenticated(isAuthenticated);
            vpnStore.setVpnInfo(vpnInfo);
            vpnStore.setEndpoints(endpointsList);
            vpnStore.setSelectedEndpoint(selectedEndpoint);
            vpnStore.setIsPremiumToken(isPremiumToken);
            settingsStore.setSwitcher(isProxyEnabled);
            // when popup is reopened, but connection is still in process,
            // we set the proxy enabled status only if connectivity state is working. task AG-2073.
            if (isConnectivityWorking) {
                settingsStore.setProxyEnabled(isConnectivityWorking);
            }
            settingsStore.setCanControlProxy(canControlProxy);
            settingsStore.setIsRoutable(isRoutable);
            await settingsStore.checkIsExcluded();
            await settingsStore.getExclusionsInverted();
            this.setInitStatus(REQUEST_STATUSES.DONE);
        } catch (e) {
            log.error(e.message);
            this.setInitStatus(REQUEST_STATUSES.ERROR);
        }
    }

    @action
    async init() {
        await this.getPopupData(MAX_GET_POPUP_DATA_ATTEMPTS);
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
