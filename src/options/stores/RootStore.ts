import { TelemetryStore } from '../../common/telemetry/TelemetryStore';
import { TranslationStore } from '../../common/locale';
import { i18n } from '../../common/i18n';

import { GlobalStore } from './GlobalStore';
import { AuthStore } from './AuthStore';
import { SettingsStore } from './SettingsStore';
import { ExclusionsStore } from './ExclusionsStore';
import { NotificationsStore } from './NotificationsStore';
import { UiStore } from './UiStore';

export class RootStore {
    globalStore: GlobalStore;

    authStore: AuthStore;

    settingsStore: SettingsStore;

    exclusionsStore: ExclusionsStore;

    notificationsStore: NotificationsStore;

    uiStore: UiStore;

    telemetryStore: TelemetryStore;

    /**
     * MobX-observable locale state shared with the {@link i18n} facade.
     */
    translationStore: TranslationStore;

    constructor() {
        this.globalStore = new GlobalStore(this);
        this.authStore = new AuthStore(this);
        this.settingsStore = new SettingsStore(this);
        this.exclusionsStore = new ExclusionsStore(this);
        this.notificationsStore = new NotificationsStore(this);
        this.uiStore = new UiStore(this);
        this.telemetryStore = new TelemetryStore();
        this.translationStore = i18n.connectStore(TranslationStore);
    }
}
