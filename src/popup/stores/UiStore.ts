import { action, observable } from 'mobx';

import type { RootStore } from './RootStore';

export class UiStore {
    @observable isOpenEndpointsSearch: boolean = false;

    @observable isOpenOptionsModal: boolean = false;

    @observable isOpenRecovery: boolean = false;

    @observable isConnecting: boolean = false;

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
}
