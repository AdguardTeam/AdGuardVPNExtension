/* eslint-disable import/no-cycle */
import { SettingsStore } from './SettingsStore';
import { UiStore } from './UiStore';
import { AuthStore } from './AuthStore';
import { VpnStore } from './VpnStore';
import { GlobalStore } from './GlobalStore';

export class RootStore {
    globalStore: GlobalStore;

    settingsStore: SettingsStore;

    uiStore: UiStore;

    authStore: AuthStore;

    vpnStore: VpnStore;

    constructor() {
        this.globalStore = new GlobalStore(this);
        this.settingsStore = new SettingsStore(this);
        this.uiStore = new UiStore(this);
        this.authStore = new AuthStore(this);
        this.vpnStore = new VpnStore(this);
    }
}
