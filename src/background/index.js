import settings from './settings';
import actions from './actions';
import {proxyApi} from './api';
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
