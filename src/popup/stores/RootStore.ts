import { TelemetryStore } from '../../common/telemetry/TelemetryStore';
import { TranslationStore } from '../../common/locale';
import { i18n } from '../../common/i18n';

/* eslint-disable import/no-cycle */
import { SettingsStore } from './SettingsStore';
import { UiStore } from './UiStore';
import { AuthStore } from './AuthStore';
import { VpnStore } from './VpnStore';
import { GlobalStore } from './GlobalStore';
import { StatsStore } from './StatsStore';

export class RootStore {
    public globalStore: GlobalStore;

    public settingsStore: SettingsStore;

    public uiStore: UiStore;

    public authStore: AuthStore;

    public vpnStore: VpnStore;

    public telemetryStore: TelemetryStore;

    public statsStore: StatsStore;

    /**
     * MobX-observable locale state shared with the {@link i18n} facade.
     */
    public translationStore: TranslationStore;

    constructor() {
        this.globalStore = new GlobalStore(this);
        this.settingsStore = new SettingsStore(this);
        this.uiStore = new UiStore(this);
        this.authStore = new AuthStore(this);
        this.vpnStore = new VpnStore(this);
        this.statsStore = new StatsStore(this);
        this.telemetryStore = new TelemetryStore();
        this.translationStore = i18n.connectStore(TranslationStore);
    }
}
