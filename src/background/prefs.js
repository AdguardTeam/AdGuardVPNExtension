import { getUrl } from './browserApi/runtime';
import { lazyGet } from '../lib/helpers';

const ICONS_PATH = 'assets/images/icons';

export const Prefs = {
    get ICONS() {
        return lazyGet(Prefs, 'ICONS', () => ({
            ENABLED: {
                19: getUrl(`${ICONS_PATH}/enabled-19.png`),
                38: getUrl(`${ICONS_PATH}/enabled-38.png`),
                128: getUrl(`${ICONS_PATH}/enabled-128.png`),
            },
            DISABLED: {
                19: getUrl(`${ICONS_PATH}/disabled-19.png`),
                38: getUrl(`${ICONS_PATH}/disabled-38.png`),
                128: getUrl(`${ICONS_PATH}/disabled-128.png`),
            },
            DISABLED_FOR_URL: {
                19: getUrl(`${ICONS_PATH}/disabled-url-19.png`),
                38: getUrl(`${ICONS_PATH}/disabled-url-38.png`),
                128: getUrl(`${ICONS_PATH}/disabled-url-128.png`),
            },
        }));
    },
};
