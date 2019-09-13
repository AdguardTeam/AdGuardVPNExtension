import { getUrl } from './runtime';
import { lazyGet } from '../lib/helpers';

const ICONS_PATH = 'assets/images/icons';

export const Prefs = {
    get ICONS() {
        return lazyGet(Prefs, 'ICONS', () => ({
            GREEN: {
                19: getUrl(`${ICONS_PATH}/green-19.png`),
                38: getUrl(`${ICONS_PATH}/green-38.png`),
            },
            GREY: {
                19: getUrl(`${ICONS_PATH}/grey-19.png`),
                38: getUrl(`${ICONS_PATH}/grey-38.png`),
            },
        }));
    },
};
