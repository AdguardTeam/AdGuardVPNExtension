import { createContext } from 'react';
import { configure } from 'mobx';

import GlobalStore from './globalStore';
import AuthStore from './authStore';
import SettingsStore from './settingsStore';

// Do not allow property change outside of store actions
configure({ enforceActions: 'observed' });

class RootStore {
    constructor() {
        this.globalStore = new GlobalStore(this);
        this.authStore = new AuthStore(this);
        this.settingsStore = new SettingsStore(this);
    }
}

export default createContext(new RootStore());
