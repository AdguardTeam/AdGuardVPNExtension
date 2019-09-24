import browser from 'webextension-polyfill';

import settings from './settings';
import actions from './actions';
import { vpnApi } from './api';
import endpoints from './endpoints';
import tabs from './tabs';
import whitelist from './whitelist';
import auth from './auth';
import { proxy } from './proxy';
import stats from './stats/stats';
import appManager from './appManager';
import tabsContext from './tabsContext';
import authCache from './authentication/authCache';

global.background = {
    settings,
    actions,
    proxy,
    vpnApi,
    endpoints,
    tabs,
    whitelist,
    auth,
    stats,
    appManager,
    tabsContext,
    authCache,
};

// message handler used for message exchange with content pages, for other cases use bgProvider
// eslint-disable-next-line no-unused-vars
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
