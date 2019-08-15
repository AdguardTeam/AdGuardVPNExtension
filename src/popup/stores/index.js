import { configure } from 'mobx';

// Do not allow property change outside of store actions
configure({ enforceActions: 'observed' });

export settingsStore from './settingsStore';
export uiStore from './uiStore';
export authStore from './authStore';
export endpointsStore from './endpointsStore';
