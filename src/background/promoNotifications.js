/**
 * This module manages promo notifications
 */
import browser from 'webextension-polyfill';

import { lazyGet } from '../lib/helpers';
import { getUrl } from './browserApi/runtime';
import browserApi from './browserApi';
import { Prefs } from './prefs';
import { notifier } from '../lib/notifier';
import { FORWARDER_DOMAIN } from './config';

const VIEWED_NOTIFICATIONS = 'viewed-notifications';
const LAST_NOTIFICATION_TIME = 'viewed-notification-time';

const backToSchool22Notification = {
    id: 'backToSchool22',
    locales: {
        en: {
            title: 'Back',
            desc: 'to school',
            btn: 'Get 80% off',
        },
        ru: {
            title: 'Снова',
            desc: 'в школу',
            btn: 'Скидка 75%',
        },
        es: {
            title: 'Vuelta al',
            desc: 'cole',
            btn: 'Obtén un 80% off',
        },
        de: {
            title: 'Zurück zur',
            desc: 'Schule',
            btn: '80% Rabatt',
        },
        fr: {
            title: 'La rentrée',
            desc: 'scolaire',
            btn: '80% de remise',
        },
        it: {
            title: 'Ritorno a',
            desc: 'scuola',
            btn: '80% di sconto',
        },
        ko: {
            title: '백 투 스쿨',
            desc: '세일',
            btn: '80% 할인',
        },
        zh_cn: {
            title: '开学啦',
            btn: '一律享受80%折扣',
        },
        zh_tw: {
            title: '開學啦',
            btn: '獲得80%的折扣',
        },
        uk: {
            title: 'Знову до',
            desc: 'школи',
            btn: 'Знижка 80%',
        },
        pt_pt: {
            title: 'De volta à',
            desc: 'escola',
            btn: 'Obter 80% de desconto',
        },
        pt_br: {
            title: 'De volta à',
            desc: 'escola',
            btn: 'Obtenha 80% de desconto',
        },
        ar: {
            title: 'العودة',
            desc: 'إلى المدرسة',
            btn: '%احصل على خصم 80',
        },
        be: {
            title: 'Назад у',
            desc: 'школу',
            btn: 'Атрымайце скідку 80%',
        },
        id: {
            title: 'Kembali ke',
            desc: 'sekolah',
            btn: 'Dapatkan diskon 80%',
        },
        pl: {
            title: 'Powrót do',
            desc: 'szkoły',
            btn: 'Zyskaj 80% zniżki',
        },
        tr: {
            title: 'Okula dönüş',
            btn: '80 indirim kazanın',
        },
        vi: {
            title: 'Trở lại',
            desc: 'trường học',
            btn: 'Được GIẢM GIÁ 80%',
        },
    },
    // will be selected for locale, see usage of getNotificationText
    text: '',
    url: `https://${FORWARDER_DOMAIN}/forward.html?action=back_to_school_22_vpn&from=popup&app=vpn_extension`,
    from: '29 August 2022 12:00:00',
    to: '4 September 2022 23:59:00',
    type: 'animated',
    get icons() {
        return lazyGet(backToSchool22Notification, 'icons', () => ({
            ENABLED: {
                19: getUrl('assets/images/icons/bts22-on-19.png'),
                38: getUrl('assets/images/icons/bts22-on-38.png'),
            },
            DISABLED: {
                19: getUrl('assets/images/icons/bts22-off-19.png'),
                38: getUrl('assets/images/icons/bts22-off-38.png'),
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
    backToSchool22: backToSchool22Notification,
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
