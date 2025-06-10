import { TelemetryStore } from '../../common/telemetry/TelemetryStore';

/* eslint-disable import/no-cycle */
import { SettingsStore } from './SettingsStore';
import { UiStore } from './UiStore';
import { AuthStore } from './AuthStore';
import { VpnStore } from './VpnStore';
import { GlobalStore } from './GlobalStore';
import { StatsStore } from './StatsStore';

export class RootStore {
    globalStore: GlobalStore;

    settingsStore: SettingsStore;

    uiStore: UiStore;

    authStore: AuthStore;

    vpnStore: VpnStore;

    telemetryStore: TelemetryStore;

    statsStore: StatsStore;

    constructor() {
        this.globalStore = new GlobalStore(this);
        this.settingsStore = new SettingsStore(this);
        this.uiStore = new UiStore(this);
        this.authStore = new AuthStore(this);
        this.vpnStore = new VpnStore(this);
        this.statsStore = new StatsStore(this);
        this.telemetryStore = new TelemetryStore();
    }
}
