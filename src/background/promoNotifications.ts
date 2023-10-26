/**
 * This module manages promo notifications
 */
import browser from 'webextension-polyfill';

import { lazyGet } from '../lib/helpers';
import { getUrl } from './browserApi/runtime';
import { browserApi } from './browserApi';
import { Prefs } from '../common/prefs';
import { notifier } from '../lib/notifier';
import { FORWARDER_DOMAIN } from './config';

interface PromoNotificationInterface {
    getCurrentNotification(): Promise<PromoNotificationData | null>;
    setNotificationViewed(withDelay: boolean): Promise<void>;
}

export interface PromoNotificationData {
    id: string;
    locales: {
        [key: string]: {
            title: string,
            btn: string,
        }
    }
    text: null | {
        title: string,
        btn: string,
    };
    url: string;
    from: string;
    to: string;
    type: string;
    icons: {
        [key: string]: {
            [key: number]: string,
        }
    }
}

const CHECK_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

const MIN_PERIOD_MS = 30 * 60 * 1000; // 30 minutes

const NOTIFICATION_DELAY_MS = 30 * 1000; // clear notification in 30 seconds

const VIEWED_NOTIFICATIONS = 'viewed-notifications';
const LAST_NOTIFICATION_TIME = 'viewed-notification-time';

const TDS_PROMO_ACTION = 'halloween_23_vpn';

const PROMO_LINK = `https://${FORWARDER_DOMAIN}/forward.html?action=${TDS_PROMO_ACTION}&from=popup&app=vpn_extension`;

const normalizeLanguage = (locale: string): string | null => {
    if (!locale) {
        return null;
    }

    return locale.toLowerCase().replace('-', '_');
};

const HALLOWEEN_23_ID = 'halloween23';

const halloween23PromoNotification = {
    id: HALLOWEEN_23_ID,
    locales: {
        en: {
            title: 'Fact or fiction?',
            btn: 'Investigate',
        },
        ru: {
            title: 'Верю не верю',
            btn: 'Давайте проверим',
        },
        es: {
            title: '¿Realidad o ficción?',
            btn: '¡Adivinar!',
        },
        de: {
            title: 'Falsch oder wahr?',
            btn: 'Kommen Sie klar',
        },
        fr: {
            title: 'Fait ou fiction ?',
            btn: 'Examinons',
        },
        it: {
            title: 'Fatto o finzione?',
            btn: 'Esaminiamo',
        },
        ko: {
            title: '사실일까, 괴담일까?',
            btn: '퀴즈 시작',
        },
        ja: {
            title: '事実か怪談か？',
            btn: 'クイズに挑戦する',
        },
        zh_cn: {
            title: '万圣节答题小游戏',
            btn: '开始玩儿',
        },
        zh_tw: {
            title: '萬聖節答題小遊戲',
            btn: '開始玩',
        },
        uk: {
            title: 'Факт чи вигадка?',
            btn: 'Вгадай!',
        },
        pt_br: {
            title: 'Realidade ou ficção?',
            btn: 'Adivinhar',
        },
        pt_pt: {
            title: 'Realidade ou ficção?',
            btn: 'Adivinhar',
        },
        ar: {
            title: 'حقيقة أم خيال؟',
            btn: '!يخمن',
        },
        be: {
            title: 'Факт ці выдумка?',
            btn: 'Адгадайце!',
        },
        bg: {
            title: 'Факт или измислица?',
            btn: 'Познайте!',
        },
        ca: {
            title: 'Realitat o ficció?',
            btn: 'Endevina!',
        },
        cs: {
            title: 'Pravda nebo fikce?',
            btn: 'Tipni si!',
        },
        da: {
            title: 'Fakta eller fiktion?',
            btn: 'Gætte!',
        },
        el: {
            title: 'Σωστό ή λάθος?',
            btn: 'Εικασία!',
        },
        es_419: {
            title: '¿Realidad o ficción?',
            btn: '¡Adivinar!',
        },
        fa: {
            title: 'واقعیت یا تخیل؟',
            btn: '!حدس بزن',
        },
        fi: {
            title: 'Totta vai tarua?',
            btn: 'Arvaus!',
        },
        he: {
            title: '?עובדה או בדיה',
            btn: '!לְנַחֵשׁ',
        },
        hr: {
            title: 'Činjenica ili fikcija?',
            btn: 'Pogodite!',
        },
        hu: {
            title: 'Tény vagy fikció?',
            btn: 'Találd ki!',
        },
        hy: {
            title: 'Փաստ, թե հորինված.',
            btn: 'Գուշակիր',
        },
        id: {
            title: 'Fakta atau Fiksi?',
            btn: 'Tebakan!',
        },
        lt: {
            title: 'Faktas ar fikcija?',
            btn: 'Atspėk!',
        },
        ms: {
            title: 'Fakta atau fiksyen?',
            btn: 'Teka!',
        },
        nb: {
            title: 'Fakta eller fiksjon?',
            btn: 'Gjett!',
        },
        nl: {
            title: 'Feit of Fictie?',
            btn: 'Gok!',
        },
        pl: {
            title: 'Fakt czy fikcja?',
            btn: 'Zgadywać!',
        },
        ro: {
            title: 'Realitate sau fictiune?',
            btn: 'Ghici!',
        },
        sk: {
            title: 'Skutočnosť alebo fikcia?',
            btn: 'Hádaj!',
        },
        sl: {
            title: 'Dejstvo ali fikcija?',
            btn: 'Ugani!',
        },
        'sr-Latn': {
            title: 'Tačno ili netačno?',
            btn: 'Izgleda!',
        },
        sv: {
            title: 'Fakta eller påhitt?',
            btn: 'Gissa!',
        },
        tr: {
            title: 'Gerçek mi kurgu mu?',
            btn: 'Tahmin etmek!',
        },
        vi: {
            title: 'Sự thật hay hư cấu?',
            btn: 'Đoán!',
        },
        hi: {
            title: 'तथ्य या कल्पना?',
            btn: 'अनुमान लगाना!',
        },
        et: {
            title: 'Fakt või väljamõeldis?',
            btn: 'Arva ära!',
        },
        th: {
            title: 'เรื่องจริงหรือนิยาย?',
            btn: 'เดา!',
        },
    },
    // will be selected for locale, see usage of getNotificationText
    text: null,
    url: PROMO_LINK,
    from: '25 October 2023 12:00:00',
    to: '1 November 2023 23:59:00',
    type: 'animated',
    get icons() {
        return lazyGet(halloween23PromoNotification, 'icons', () => ({
            ENABLED: {
                19: getUrl('assets/images/icons/halloween23-on-19.png'),
                38: getUrl('assets/images/icons/halloween23-on-38.png'),
            },
            DISABLED: {
                19: getUrl('assets/images/icons/halloween23-off-19.png'),
                38: getUrl('assets/images/icons/halloween23-off-38.png'),
            },
        }));
    },
};

/**
 * @typedef Notification
 * @type object
 * @property {string} id
 * @property {object} locales
 * @property {string} url
 * @property {string} text
 * @property {string} from
 * @property {string} to
 * @property {string} bgColor;
 * @property {string} textColor;
 * @property {string} badgeBgColor;
 * @property {string} badgeText;
 * @property {string} type;
 */

const notifications: { [key: string]: PromoNotificationData } = {
    [HALLOWEEN_23_ID]: halloween23PromoNotification,
};

/**
 * Gets the last time a notification was shown.
 * If it was not shown yet, initialized with the current time.
 */
const getLastNotificationTime = async (): Promise<number> => {
    let lastTime = await browserApi.storage.get<number>(LAST_NOTIFICATION_TIME) || 0;
    if (lastTime === 0) {
        lastTime = new Date().getTime();
        await browserApi.storage.set(LAST_NOTIFICATION_TIME, lastTime);
    }
    return lastTime;
};

/**
 * Scans notification locales and returns the one matching navigator.language
 * @param notification notification object
 * returns matching text or null
 */
const getNotificationText = (notification: PromoNotificationData): { title: string, btn: string } | null => {
    const language = normalizeLanguage(browser.i18n.getUILanguage());

    if (!language) {
        return null;
    }

    const languageCode = language.split('_')[0];
    if (!languageCode) {
        return null;
    }

    return notification.locales[language] || notification.locales[languageCode];
};

/**
 * Scans notifications list and prepares them to be used (or removes expired)
 */
const initNotifications = (): void => {
    const notificationsKeys = Object.keys(notifications);

    for (let i = 0; i < notificationsKeys.length; i += 1) {
        const notificationKey = notificationsKeys[i];
        const notification = notifications[notificationKey];

        notification.text = getNotificationText(notification);

        const to = new Date(notification.to).getTime();
        const expired = new Date().getTime() > to;

        if (!notification.text || expired) {
            // Remove expired and invalid
            delete notifications[notificationKey];
        }
    }
};

// Prepare the notifications
initNotifications();

let currentNotification: PromoNotificationData | null;
let notificationCheckTime: number;
let timeoutId: number;

/**
 * Marks current notification as viewed
 * @param withDelay if true, do this after a 30 sec delay
 */
const setNotificationViewed = async (withDelay: boolean): Promise<void> => {
    if (withDelay) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            setNotificationViewed(false);
        }, NOTIFICATION_DELAY_MS) as any; // TODO setup tsconfig to fix types
        // do not continue if `withDelay` is true, otherwise it may set a notification as viewed
        return;
    }

    if (currentNotification) {
        const viewedNotifications = (await browserApi.storage.get<string[]>(VIEWED_NOTIFICATIONS)) || [];
        const { id } = currentNotification;
        if (!viewedNotifications.includes(id)) {
            viewedNotifications.push(id);
            await browserApi.storage.set(VIEWED_NOTIFICATIONS, viewedNotifications);
            notifier.notifyListeners(notifier.types.UPDATE_BROWSER_ACTION_ICON);
            currentNotification = null;
        }
    }
};

/**
 * Finds out notification for current time and checks if notification wasn't shown yet
 * returns notification
 */
const getCurrentNotification = async (): Promise<PromoNotificationData | null> => {
    // Do not display notification on Firefox
    if (Prefs.isFirefox()) {
        return null;
    }

    const currentTime = new Date().getTime();

    const timeSinceLastNotification = currentTime - (await getLastNotificationTime());
    if (timeSinceLastNotification < MIN_PERIOD_MS) {
        // Just a check to not show the notification too often
        return null;
    }

    // Check not often than once in 10 minutes
    const timeSinceLastCheck = currentTime - notificationCheckTime;
    if (notificationCheckTime > 0 && timeSinceLastCheck <= CHECK_TIMEOUT_MS) {
        return currentNotification;
    }

    // Update the last notification check time
    notificationCheckTime = currentTime;

    const notificationsKeys = Object.keys(notifications);
    const viewedNotifications = (await browserApi.storage.get<string[]>(VIEWED_NOTIFICATIONS)) || [];

    for (let i = 0; i < notificationsKeys.length; i += 1) {
        const notificationKey = notificationsKeys[i];
        const notification = notifications[notificationKey];
        const from = new Date(notification.from).getTime();
        const to = new Date(notification.to).getTime();
        if (from < currentTime
            && to > currentTime
            && !viewedNotifications.includes(notification.id)
        ) {
            currentNotification = notification;
            return currentNotification;
        }
    }
    currentNotification = null;
    return currentNotification;
};

export const promoNotifications: PromoNotificationInterface = {
    getCurrentNotification,
    setNotificationViewed,
};
