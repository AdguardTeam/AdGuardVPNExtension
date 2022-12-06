import { getUrl } from './browserApi/runtime';
import { lazyGet } from '../lib/helpers';

const ICONS_PATH = 'assets/images/icons';

export const BROWSER_NAMES = {
    CHROME: 'Chrome',
    FIREFOX: 'Firefox',
    OPERA: 'Opera',
    EDGE: 'Edge',
    EDGE_CHROMIUM: 'EdgeChromium',
    YA_BROWSER: 'YaBrowser',
};

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
            TRAFFIC_OFF: {
                19: getUrl(`${ICONS_PATH}/traffic-off-19.png`),
                38: getUrl(`${ICONS_PATH}/traffic-off-38.png`),
                128: getUrl(`${ICONS_PATH}/traffic-off-128.png`),
            },
        }));
    },

    get browser() {
        return lazyGet(Prefs, 'browser', () => {
            let browser;
            let { userAgent } = navigator;
            userAgent = userAgent.toLowerCase();
            if (userAgent.indexOf('yabrowser') >= 0) {
                browser = BROWSER_NAMES.YA_BROWSER;
            } else if (userAgent.indexOf('edge') >= 0) {
                browser = BROWSER_NAMES.EDGE;
            } else if (userAgent.indexOf('edg') >= 0) {
                browser = BROWSER_NAMES.EDGE_CHROMIUM;
            } else if (userAgent.indexOf('opera') >= 0
                || userAgent.indexOf('opr') >= 0) {
                browser = BROWSER_NAMES.OPERA;
            } else if (userAgent.indexOf('firefox') >= 0) {
                browser = BROWSER_NAMES.FIREFOX;
            } else {
                browser = BROWSER_NAMES.CHROME;
            }
            return browser;
        });
    },

    // FIXME: add isFirefox()
};
