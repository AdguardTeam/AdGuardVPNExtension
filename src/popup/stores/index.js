import { createContext } from 'react';
import { configure } from 'mobx';

import SettingsStore from './settingsStore';
import UiStore from './uiStore';
import AuthStore from './authStore';
import VpnStore from './vpnStore';
import TooltipStore from './tooltipStore';

// Do not allow property change outside of store actions
configure({ enforceActions: 'observed' });

class RootStore {
    constructor() {
        this.settingsStore = new SettingsStore(this);
        this.uiStore = new UiStore(this);
        this.authStore = new AuthStore(this);
        this.vpnStore = new VpnStore(this);
        this.tooltipStore = new TooltipStore(this);
    }
}

export default createContext(new RootStore());
