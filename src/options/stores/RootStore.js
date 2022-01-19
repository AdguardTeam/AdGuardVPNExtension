import { GlobalStore } from './GlobalStore';
import { AuthStore } from './AuthStore';
import { SettingsStore } from './SettingsStore';
import { ExclusionsStore } from './ExclusionsStore';
import { NotificationsStore } from './NotificationsStore';

export class RootStore {
    constructor() {
        this.globalStore = new GlobalStore(this);
        this.authStore = new AuthStore(this);
        this.settingsStore = new SettingsStore(this);
        this.exclusionsStore = new ExclusionsStore(this);
        this.notificationsStore = new NotificationsStore(this);
    }
}
