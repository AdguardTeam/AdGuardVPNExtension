import settings from './settings';
import actions from './actions';
import { proxy } from './proxy';

global.background = {
    settings,
    actions,
    proxy,
};
