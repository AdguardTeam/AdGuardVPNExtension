import { action, observable, runInAction } from 'mobx';

import { messenger } from '../../common/messenger';

import type { RootStore } from './RootStore';
import { RequestStatus } from './consts';

export class AuthStore {
    @observable public authenticated = false;

    @observable public requestProcessState = RequestStatus.Done;

    @observable public maxDevicesCount = 0;

    private rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @action public setIsAuthenticated = (value: boolean): void => {
        this.authenticated = value;
    };

    @action public deauthenticate = async (): Promise<void> => {
        await messenger.deauthenticateUser();
        await this.rootStore.settingsStore.disableProxy();
        runInAction(() => {
            this.authenticated = false;
        });
    };

    @action public setMaxDevicesCount = (value: number): void => {
        this.maxDevicesCount = value;
    };
}
