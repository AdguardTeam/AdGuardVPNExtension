/**
 * This module manages promo notifications
 */
import browser from 'webextension-polyfill';

import { lazyGet } from '../lib/helpers';
import { getUrl } from './browserApi/runtime';
import { browserApi } from './browserApi';
import { Prefs } from './prefs';
import { notifier } from '../lib/notifier';
import { FORWARDER_DOMAIN } from './config';
import { timers } from './timers';

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

const VIEWED_NOTIFICATIONS = 'viewed-notifications';
const LAST_NOTIFICATION_TIME = 'viewed-notification-time';

const RUSSIAN_LOCALE = 'ru';

const COMMON_PROMO_LINK = `https://${FORWARDER_DOMAIN}/forward.html?action=easter_promo_23_vpn&from=popup&app=vpn_extension`;
const RUSSIAN_PROMO_LINK = `https://${FORWARDER_DOMAIN}/forward.html?action=easter_promo_23_vpn_ru&from=popup&app=vpn_extension`;

const normalizeLanguage = (locale: string): string | null => {
    if (!locale) {
        return null;
    }

    return locale.toLowerCase().replace('-', '_');
};

const currentLocale = normalizeLanguage(browser.i18n.getUILanguage());
const promoLink = currentLocale === RUSSIAN_LOCALE ? RUSSIAN_PROMO_LINK : COMMON_PROMO_LINK;

const easterPromo23Notification = {
    id: 'easterPromo23',
    locales: {
        en: {
            title: 'Easter promo',
            btn: 'Get 80% off',
        },
        ru: {
            title: 'Весенняя акция',
            btn: 'Скидка 75%',
        },
        ko: {
            title: '부활절 세일',
            btn: '85% 할인',
        },
        es: {
            title: 'Promo de Pascua',
            btn: 'Gana un 80% de descuento',
        },
        de: {
            title: 'Oster-Sale',
            btn: '80% Rabatt',
        },
        pt_pt: {
            title: 'Promo de Páscoa',
            btn: '80% de desconto',
        },
        pt_br: {
            title: 'Promo de Páscoa',
            btn: '80% de desconto',
        },
        zh_tw: {
            title: '暖春巨惠',
            btn: '享2折',
        },
        zh_cn: {
            title: '暖春特惠',
            btn: '享2折',
        },
        fr: {
            title: 'Promo Pâques',
            btn: 'Obtenez 80% de remise',
        },
        it: {
            title: 'Offerta Pascua',
            btn: 'Ottieni 80% di sconto',
        },
        uk: {
            title: 'Весняна акція',
            btn: 'Знижка 80%',
        },
        ar: {
            title: 'تعزيز الربيع',
            btn: '80٪ خصم',
        },
        be: {
            title: 'Вясновая акцыя',
            btn: 'Зніжка 80%',
        },
        bg: {
            title: 'Пролетна промоция',
            btn: '80% отстъпка',
        },
        ca: {
            title: 'Promoció de Pasqua',
            btn: '80% de descompte',
        },
        cs: {
            title: 'Velikonoční promo akce',
            btn: '80% sleva',
        },
        da: {
            title: 'Påske kampagne',
            btn: '80% rabat',
        },
        el: {
            title: 'ανοιξιάτικη προώθηση',
            btn: '80% έκπτωση',
        },
        es_419: {
            title: 'Promoción de pascua',
            btn: '80% de descuento',
        },
        fa: {
            title: 'تبلیغات بهار',
            btn: '80 درصد تخفیف',
        },
        fi: {
            title: 'Pääsiäispromo',
            btn: '80 % alennus',
        },
        he: {
            title: 'קידום אביב',
            btn: '80% הנחה',
        },
        hr: {
            title: 'Uskršnja promocija',
            btn: '80% popusta',
        },
        hu: {
            title: 'Tavaszi akció',
            btn: '80% kedvezmény',
        },
        hy: {
            title: 'գարնանային ակցիա',
            btn: '80% զեղչ',
        },
        id: {
            title: 'Promosi musim semi',
            btn: 'Diskon 80%',
        },
        lt: {
            title: 'Velykų akcija',
            btn: '80% nuolaida',
        },
        ms: {
            title: 'Promosi musim bunga',
            btn: 'Diskaun 80%',
        },
        nb: {
            title: 'Påskekampanje',
            btn: '80% rabatt',
        },
        nl: {
            title: 'Pasen promo',
            btn: '80% korting',
        },
        pl: {
            title: 'Promocja wielkanocna',
            btn: '80% zniżki',
        },
        ro: {
            title: 'Promoție de primăvară',
            btn: '80% reducere',
        },
        sk: {
            title: 'Veľkonočné promo',
            btn: '80% zľava',
        },
        sl: {
            title: 'Velikonočni promo',
            btn: '80% popust',
        },
        sr: {
            title: 'Prolećna promocija',
            btn: 'Popust 80%',
        },
        sv: {
            title: 'Påsk kampanj',
            btn: '80 % rabatt',
        },
        tr: {
            title: 'Bahar promosyonu',
            btn: '%80 indirim',
        },
        vi: {
            title: 'Khuyến mãi mùa xuân',
            btn: 'Giảm giá 80%',
        },
    },
    // will be selected for locale, see usage of getNotificationText
    text: null,
    url: promoLink,
    from: '06 April 2023 12:00:00',
    to: '12 April 2023 23:59:00',
    type: 'animated',
    get icons() {
        return lazyGet(easterPromo23Notification, 'icons', () => ({
            ENABLED: {
                19: getUrl('assets/images/icons/easter2023-on-19.png'),
                38: getUrl('assets/images/icons/easter2023-on-38.png'),
            },
            DISABLED: {
                19: getUrl('assets/images/icons/easter2023-off-19.png'),
                38: getUrl('assets/images/icons/easter2023-off-38.png'),
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
    easterPromo23: easterPromo23Notification,
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
const checkTimeoutMs = 10 * 60 * 1000; // 10 minutes
const minPeriod = 30 * 60 * 1000; // 30 minutes
const NOTIFICATION_DELAY = 30 * 1000; // clear notification in 30 seconds
let timeoutId: number;

/**
 * Marks current notification as viewed
 * @param withDelay if true, do this after a 30 sec delay
 */
const setNotificationViewed = async (withDelay: boolean): Promise<void> => {
    if (withDelay) {
        timers.clearTimeout(timeoutId);
        timeoutId = timers.setTimeout(() => {
            setNotificationViewed(false);
        }, NOTIFICATION_DELAY);
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
    if (Prefs.browser === 'Firefox') {
        return null;
    }

    const currentTime = new Date().getTime();

    const timeSinceLastNotification = currentTime - (await getLastNotificationTime());
    if (timeSinceLastNotification < minPeriod) {
        // Just a check to not show the notification too often
        return null;
    }

    // Check not often than once in 10 minutes
    const timeSinceLastCheck = currentTime - notificationCheckTime;
    if (notificationCheckTime > 0 && timeSinceLastCheck <= checkTimeoutMs) {
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
