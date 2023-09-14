import { getUrl } from '../background/browserApi/runtime';
import { lazyGet } from '../lib/helpers';

const ICONS_PATH = 'assets/images/icons';

interface PrefsInterface {
    ICONS: {
        [key: string]: {
            [key: number]: string,
        },
    };
    browser: string;
    isFirefox(): boolean;
}

enum BrowserName {
    Chrome = 'Chrome',
    Firefox = 'Firefox',
    Opera = 'Opera',
    Edge = 'Edge',
    EdgeChromium = 'EdgeChromium',
    YaBrowser = 'YaBrowser',
}

export const Prefs: PrefsInterface = {
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

    isFirefox(): boolean {
        return this.browser === BrowserName.Firefox;
    },

    get browser(): string {
        return lazyGet(Prefs, 'browser', () => {
            let browser;
            let { userAgent } = navigator;
            userAgent = userAgent.toLowerCase();
            if (userAgent.indexOf('yabrowser') >= 0) {
                browser = BrowserName.YaBrowser;
            } else if (userAgent.indexOf('edge') >= 0) {
                browser = BrowserName.Edge;
            } else if (userAgent.indexOf('edg') >= 0) {
                browser = BrowserName.EdgeChromium;
            } else if (userAgent.indexOf('opera') >= 0
                || userAgent.indexOf('opr') >= 0) {
                browser = BrowserName.Opera;
            } else if (userAgent.indexOf('firefox') >= 0) {
                browser = BrowserName.Firefox;
            } else {
                browser = BrowserName.Chrome;
            }
            return browser;
        });
    },
};
