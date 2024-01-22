import {
    action,
    observable,
    runInAction,
} from 'mobx';

import { messenger } from '../../lib/messenger';

import type { RootStore } from './RootStore';
import { RequestStatus } from './consts';

export class AuthStore {
    @observable authenticated = false;

    @observable requestProcessState = RequestStatus.Done;

    @observable maxDevicesCount = 0;

    private rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @action setIsAuthenticated = (value: boolean): void => {
        this.authenticated = value;
    };

    @action deauthenticate = async (): Promise<void> => {
        await messenger.deauthenticateUser();
        await this.rootStore.settingsStore.disableProxy();
        runInAction(() => {
            this.authenticated = false;
        });
    };

    @action setMaxDevicesCount = (value: number): void => {
        this.maxDevicesCount = value;
    };
}
