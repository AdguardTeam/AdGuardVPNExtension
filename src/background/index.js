import browser from 'webextension-polyfill';

import settings from './settings';
import actions from './actions';
import { proxyApi } from './api';
import provider from './provider';
import tabs from './tabs';
import whitelist from './whitelist';
import auth from './auth';
import { proxy } from './proxy';

global.background = {
    settings,
    actions,
    proxy,
    proxyApi,
    provider,
    tabs,
    whitelist,
    auth,
};

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
