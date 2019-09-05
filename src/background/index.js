import browser from 'webextension-polyfill';

import settings from './settings';
import actions from './actions';
import { vpnApi } from './api';
import provider from './provider';
import tabs from './tabs';
import whitelist from './whitelist';
import auth from './auth';
import credentials from './credentials';
import { proxy } from './proxy';
import stats from './stats/stats';
import appManager from './appManager';
import tabsContext from './tabsContext';

global.background = {
    settings,
    actions,
    proxy,
    vpnApi,
    provider,
    tabs,
    whitelist,
    auth,
    stats,
    appManager,
    tabsContext,
};

// TODO [maximtop] move credentials dependency into UI
(async () => {
    try {
        const res = await credentials.gainVpnCredentials();
        console.log(res);
    } catch (e) {
        console.log(e);
    }
})();

// message handler used for message exchange with content pages, for other cases use bgProvider
browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    const { type } = request;
    switch (type) {
        case 'authenticateSocial': {
            const { tab: { id } } = sender;
            const { queryString } = request;
            await auth.authenticateSocial(queryString, id);
            break;
        }
        default:
            break;
    }
    return true;
});
