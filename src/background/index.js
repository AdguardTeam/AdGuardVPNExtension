import settings from './settings';
import actions from './actions';
import api from './api';
import provider from './provider';
import tabs from './tabs';
import whitelist from './whitelist';
import { proxy } from './proxy';


global.background = {
    settings,
    actions,
    proxy,
    api,
    provider,
    tabs,
    whitelist,
};
