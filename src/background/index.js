import settings from './settings';
import actions from './actions';
import { vpnApi } from './api';
import tabs from './tabs';
import whitelist from './whitelist';
import auth from './auth';
import { proxy } from './proxy';
import connectivity from './connectivity/connectivity';
import appManager from './appManager';
import tabsContext from './tabsContext';
import authCache from './authentication/authCache';
import messaging from './messaging';
import vpn from './vpn';

global.adguard = {
    settings,
    actions,
    proxy,
    vpnApi,
    endpoints: vpn,
    tabs,
    whitelist,
    auth,
    connectivity,
    appManager,
    tabsContext,
    authCache,
    vpn,
};

// init messaging
messaging.init();
