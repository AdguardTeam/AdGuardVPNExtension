import { action, observable } from 'mobx';

import type { RootStore } from './RootStore';

export class UiStore {
    @observable isOpenEndpointsSearch: boolean = false;

    @observable isOpenOptionsModal: boolean = false;

    @observable isOpenRecovery: boolean = false;

    @observable isConnecting: boolean = false;

    /**
     * Flag for the notice if some locations are not available.
     *
     * Init value is `true`.
     */
    @observable isShownVpnBlockedErrorNotice: boolean = true;

    /**
     * Flag for the details modal if some locations are not available.
     *
     * Init value is `false`.
     */
    @observable isShownVpnBlockedErrorDetails: boolean = false;

    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @action enableConnecting = (): void => {
        this.isConnecting = true;
    };

    @action disableConnecting = (): void => {
        this.isConnecting = false;
    };

    @action openEndpointsSearch = (): void => {
        this.isOpenEndpointsSearch = true;
    };

    @action closeEndpointsSearch = (): void => {
        this.isOpenEndpointsSearch = false;
    };

    @action openOptionsModal = (): void => {
        this.isOpenOptionsModal = true;
    };

    @action closeOptionsModal = (): void => {
        this.isOpenOptionsModal = false;
    };

    @action openVpnBlockedErrorNotice = (): void => {
        this.isShownVpnBlockedErrorNotice = true;
    };

    @action closeVpnBlockedErrorNotice = (): void => {
        this.isShownVpnBlockedErrorNotice = false;
    };

    @action openVpnBlockedErrorDetails = (): void => {
        // hide the notice
        this.isShownVpnBlockedErrorNotice = false;
        // show the details
        this.isShownVpnBlockedErrorDetails = true;
    };

    @action closeVpnBlockedErrorDetails = (): void => {
        this.isShownVpnBlockedErrorDetails = false;
    };
}
