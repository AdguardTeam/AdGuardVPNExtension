import settings from './settings';
import actions from './actions';
import api from './api';
import provider from './provider';
import { proxy } from './proxy';

global.background = {
    settings,
    actions,
    proxy,
    api,
    provider,
};
