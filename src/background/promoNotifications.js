/* global chrome */

/**
 * This module manages promo notifications
 */
import { lazyGet } from '../lib/helpers';
import { getUrl } from './browserApi/runtime';
import { browserApi } from './browserApi';
import { Prefs } from './prefs';
import { notifier } from '../lib/notifier';
import { FORWARDER_DOMAIN } from './config';

const VIEWED_NOTIFICATIONS = 'viewed-notifications';
const LAST_NOTIFICATION_TIME = 'viewed-notification-time';

const RUSSIAN_LOCALE = 'ru';

const COMMON_PROMO_LINK = `https://${FORWARDER_DOMAIN}/forward.html?action=black_friday_22_vpn&from=popup&app=vpn_extension`;
const RUSSIAN_PROMO_LINK = `https://${FORWARDER_DOMAIN}/forward.html?action=black_friday_22_vpn_ru&from=popup&app=vpn_extension`;

const normalizeLanguage = (locale) => {
    if (!locale) {
        return null;
    }

    return locale.toLowerCase().replace('-', '_');
};

const currentLocale = normalizeLanguage(chrome.i18n.getUILanguage());
const promoLink = currentLocale === RUSSIAN_LOCALE ? RUSSIAN_PROMO_LINK : COMMON_PROMO_LINK;

const blackFriday22Notification = {
    id: 'blackFriday22',
    locales: {
        en: {
            title: 'Black Friday',
            btn: 'Get 85% off',
        },
        ru: {
            title: 'Чёрная пятница',
            btn: 'Скидка 80%',
        },
        ja: {
            title: 'BLACK FRIDAY',
            btn: '80%OFF割引をGETする',
        },
        ko: {
            title: '블랙 프라이데이',
            btn: '85% 할인',
        },
        es: {
            title: 'Black Friday',
            btn: 'Descuento de 85%',
        },
        de: {
            title: 'Black Friday',
            btn: '85% Rabatt',
        },
        pt_pt: {
            title: 'Black Friday',
            btn: 'Desconto de 85%',
        },
        pt_br: {
            title: 'Black Friday',
            btn: 'Desconto de 85%',
        },
        zh_tw: {
            title: '黑五優惠',
            btn: '享1.5折',
        },
        zh_cn: {
            title: '黑五优惠',
            btn: '享1.5折',
        },
        fr: {
            title: 'Black Friday',
            btn: '85% de remise',
        },
        it: {
            title: 'Black Friday',
            btn: '85% di sconto',
        },
        uk: {
            title: 'Чорна п\'ятниця',
            btn: 'Знижка 85%',
        },
        ar: {
            title: 'الجمعة السوداء',
            btn: '%خصم 85',
        },
        be: {
            title: 'Чорная пятніца',
            btn: '85% зніжка',
        },
        bg: {
            title: 'Черен петък',
            btn: '85% отстъпка',
        },
        ca: {
            title: 'Divendres Negre',
            btn: '85% de descompte',
        },
        cs: {
            title: 'Černý pátek',
            btn: '85% sleva',
        },
        da: {
            title: 'Black Friday',
            btn: '85% rabat',
        },
        el: {
            title: 'Μαύρη Παρασκευή',
            btn: '85% έκπτωση',
        },
        fa: {
            title: 'جمعه سیاه',
            btn: '85٪ تخفیف',
        },
        fi: {
            title: 'Black Friday',
            btn: '85% alennus',
        },
        he: {
            title: 'Black Friday',
            btn: '85% הנחה',
        },
        hr: {
            title: 'Crni petak',
            btn: '85% popusta',
        },
        hu: {
            title: 'Fekete péntek',
            btn: '85% kedvezmény',
        },
        hy: {
            title: 'Սեւ ուրբաթ',
            btn: '85% զեղչ',
        },
        id: {
            title: 'Jumat Hitam',
            btn: 'Diskon 85%',
        },
        lt: {
            title: 'Juodasis penktadienis',
            btn: '85% nuolaida',
        },
        ms: {
            title: 'Jumaat Hitam',
            btn: 'Diskaun 85%',
        },
        nb: {
            title: 'Svart fredag',
            btn: '85% rabatt',
        },
        nl: {
            title: 'Zwarte Vrijdag',
            btn: '85% korting',
        },
        pl: {
            title: 'Czarny piątek',
            btn: '85% zniżki',
        },
        ro: {
            title: 'Black Friday',
            btn: '85% reducere',
        },
        sk: {
            title: 'Čierny piatok',
            btn: '85% zľava',
        },
        sl: {
            title: 'Črni petek',
            btn: '85% popust',
        },
        sr: {
            title: 'Crni petak',
            btn: '85% popusta',
        },
        sv: {
            title: 'Black Friday',
            btn: '85% rabatt',
        },
        tr: {
            title: 'Black Friday',
            btn: '%85 indirim',
        },
        vi: {
            title: 'Black Friday',
            btn: 'Giảm giá 85%',
        },
    },
    // will be selected for locale, see usage of getNotificationText
    text: '',
    url: promoLink,
    from: '22 November 2022 15:00:00',
    to: '29 November 2022 23:59:00',
    type: 'animated',
    get icons() {
        return lazyGet(blackFriday22Notification, 'icons', () => ({
            ENABLED: {
                19: getUrl('assets/images/icons/bf22-on-19.png'),
                38: getUrl('assets/images/icons/bf22-on-38.png'),
            },
            DISABLED: {
                19: getUrl('assets/images/icons/bf22-off-19.png'),
                38: getUrl('assets/images/icons/bf22-off-38.png'),
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
    blackFriday22: blackFriday22Notification,
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

/**
 * Scans notification locales and returns the one matching navigator.language
 * @param {*} notification notification object
 * @returns {string} matching text or null
 */
const getNotificationText = (notification) => {
    const language = normalizeLanguage(chrome.i18n.getUILanguage());

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
