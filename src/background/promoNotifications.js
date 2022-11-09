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

const VIEWED_NOTIFICATIONS = 'viewed-notifications';
const LAST_NOTIFICATION_TIME = 'viewed-notification-time';

const halloweenPromo22Notification = {
    id: 'halloweenPromo22',
    locales: {
        en: {
            title: 'Halloween promo',
            btn: 'Get 80% off',
        },
        ru: {
            title: 'Акция на Хэллоуин',
            btn: 'Скидка 75%',
        },
        ja: {
            title: 'ハロウィンキャンペーン',
            btn: '80%OFFでGET',
        },
        ko: {
            title: '할로윈 프로모션',
            btn: '80% 할인 받기',
        },
        es: {
            title: 'Rebajas de Halloween',
            btn: 'Obtén un 80% off',
        },
        de: {
            title: 'Halloween-Sale',
            btn: '80% Rabatt erhalten',
        },
        pt_pt: {
            title: 'Promoção de Halloween',
            btn: 'Garanta 80% off',
        },
        pt_br: {
            title: 'Promoção de Halloween',
            btn: 'Garanta 80% off',
        },
        zh_tw: {
            title: '萬聖節折扣',
            btn: '低至2折',
        },
        zh_cn: {
            title: '万圣节特惠',
            btn: '低至2折',
        },
        fr: {
            title: 'Promo Halloween',
            btn: 'Remise 80%',
        },
        it: {
            title: 'Offerta Halloween',
            btn: '80% di sconto',
        },
        uk: {
            title: 'Акція на Хелловін',
            btn: 'Знижка 80%',
        },
        ar: {
            title: 'عرض عيد الهالوين',
            btn: '٪احصل على خصم 80',
        },
        be: {
            title: 'Прома на Хэлоўін',
            btn: 'Зніжка 80%',
        },
        bg: {
            title: 'Хелоуин промо',
            btn: '80% отстъпка',
        },
        ca: {
            title: 'Promoció de Halloween',
            btn: '80% de descompte',
        },
        cs: {
            title: 'Halloweenská promo akce',
            btn: '80% sleva',
        },
        da: {
            title: 'Halloween-kampagne',
            btn: 'Få 80% rabat',
        },
        el: {
            title: 'Απόκριες promo',
            btn: 'Έκπτωση 80%',
        },
        fa: {
            title: 'تبلیغاتی هالووین',
            btn: 'دریافت 80٪ خاموش',
        },
        fi: {
            title: 'Halloween-kampanja',
            btn: 'Saat 80% alennuksen',
        },
        he: {
            title: 'פרומו ליל כל הקדושים',
            btn: 'קבל 80% הנחה',
        },
        hr: {
            title: 'Promocija za Noć vještica',
            btn: '80% popusta',
        },
        hu: {
            title: 'Halloween promóció',
            btn: '80% kedvezmény',
        },
        hy: {
            title: 'Հելոուինի պրոմո',
            btn: '80% զեղչ',
        },
        id: {
            title: 'Promosi Halloween',
            btn: 'Dapatkan diskon 80%',
        },
        lt: {
            title: 'Helovino akcija',
            btn: '80% nuolaida',
        },
        ms: {
            title: 'Promosi Halloween',
            btn: 'Diskaun 80%',
        },
        nb: {
            title: 'Halloween-kampanje',
            btn: 'Få 80% avslag',
        },
        nl: {
            title: 'Halloween promotie',
            btn: 'Ontvang 80% korting',
        },
        pl: {
            title: 'Promocja Halloween',
            btn: 'Uzyskaj 80% zniżki',
        },
        ro: {
            title: 'Promoție de Halloween',
            btn: '80% reducere',
        },
        sk: {
            title: 'Propagácia Halloweenu',
            btn: 'Získajte 80% zľavu',
        },
        sl: {
            title: 'Promocija noči čarovnic',
            btn: 'Dobi 80% popusta',
        },
        sr: {
            title: 'Promocija za Noć veštica',
            btn: 'Skini 80% popusta',
        },
        sv: {
            title: 'Halloween-kampanj',
            btn: 'Få 80% rabatt',
        },
        tr: {
            title: 'Cadılar Bayramı promosyonu',
            btn: '%80 indirim',
        },
        vi: {
            title: 'Khuyến mãi Halloween',
            btn: 'Giảm giá 80%',
        },
    },
    // will be selected for locale, see usage of getNotificationText
    text: '',
    url: `https://${FORWARDER_DOMAIN}/forward.html?action=halloween_promo_22_vpn&from=popup&app=vpn_extension`,
    from: '27 October 2022 12:00:00',
    to: '2 November 2022 23:59:00',
    type: 'animated',
    get icons() {
        return lazyGet(halloweenPromo22Notification, 'icons', () => ({
            ENABLED: {
                19: getUrl('assets/images/icons/hlw22-on-19.png'),
                38: getUrl('assets/images/icons/hlw22-on-38.png'),
            },
            DISABLED: {
                19: getUrl('assets/images/icons/hlw22-off-19.png'),
                38: getUrl('assets/images/icons/hlw22-off-38.png'),
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

const notifications = {
    halloweenPromo22: halloweenPromo22Notification,
};

/**
 * Gets the last time a notification was shown.
 * If it was not shown yet, initialized with the current time.
 */
const getLastNotificationTime = async () => {
    let lastTime = await browserApi.storage.get(LAST_NOTIFICATION_TIME) || 0;
    if (lastTime === 0) {
        lastTime = new Date().getTime();
        await browserApi.storage.set(LAST_NOTIFICATION_TIME, lastTime);
    }
    return lastTime;
};

const normalizeLanguage = (locale) => {
    if (!locale) {
        return null;
    }

    return locale.toLowerCase().replace('-', '_');
};

/**
 * Scans notification locales and returns the one matching navigator.language
 * @param {*} notification notification object
 * @returns {string} matching text or null
 */
const getNotificationText = (notification) => {
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
const initNotifications = () => {
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

let currentNotification;
let notificationCheckTime;
const checkTimeoutMs = 10 * 60 * 1000; // 10 minutes
const minPeriod = 30 * 60 * 1000; // 30 minutes
const DELAY = 30 * 1000; // clear notification in 30 seconds
let timeoutId;

/**
 * Marks current notification as viewed
 * @param {boolean} withDelay if true, do this after a 30 sec delay
 */
const setNotificationViewed = async (withDelay) => {
    if (withDelay) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            setNotificationViewed(false);
        }, DELAY);
        return;
    }

    if (currentNotification) {
        const viewedNotifications = (await browserApi.storage.get(VIEWED_NOTIFICATIONS)) || [];
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
 *
 * @returns {null|Notification} - notification
 */
const getCurrentNotification = async () => {
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
    const viewedNotifications = (await browserApi.storage.get(VIEWED_NOTIFICATIONS)) || [];

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

export const promoNotifications = {
    getCurrentNotification,
    setNotificationViewed,
};
