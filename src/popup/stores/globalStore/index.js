import {
    action,
    computed,
    observable,
} from 'mobx';

import { MAX_GET_POPUP_DATA_ATTEMPTS, REQUEST_STATUSES } from '../consts';
import log from '../../../lib/logger';
import tabs from '../../../background/tabs';
import messager from '../../../lib/messager';

class globalStore {
    @observable initStatus = REQUEST_STATUSES.PENDING;

    constructor(rootStore) {
        this.rootStore = rootStore;
        // If popup closes before popup data was received, cancel receiving on the background page
        // otherwise extension will freeze
        window.addEventListener('unload', () => {
            const reason = 'Popup closed';
            // TODO remove methods canceling requests
            // adguard.popupData.cancelGettingPopupData(reason);
            adguard.endpoints.endpointsManager.cancelGetFastest(reason);
        });
    }

    @action
    async getPopupData(numberOfTries = 1) {
        const { rootStore: { vpnStore, settingsStore, authStore } } = this;

        this.setInitStatus(REQUEST_STATUSES.PENDING);

        // Used tab api because calling tab api from background returns wrong result
        const tab = await tabs.getCurrent();

        try {
            const popupData = await messager.getPopupData(tab.url, numberOfTries);
            console.log(popupData);
            // const popupData = await adguard.popupData.getPopupDataRetryWithCancel(
            //     currentTab.url,
            //     retryNum
            // );

            const {
                vpnInfo,
                endpointsList,
                selectedEndpoint,
                permissionsError,
                isAuthenticated,
                canControlProxy,
                isProxyEnabled,
                isRoutable,
                hasRequiredData,
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
            settingsStore.setProxyEnabledStatus(isProxyEnabled);
            settingsStore.setCanControlProxy(canControlProxy);
            settingsStore.setIsRoutable(isRoutable);
            await settingsStore.checkIsExcluded();
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
