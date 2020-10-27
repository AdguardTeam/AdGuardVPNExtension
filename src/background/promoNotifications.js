/**
 * This module manages promo notifications
 */
import browser from 'webextension-polyfill';

import { lazyGet } from '../lib/helpers';
import { getUrl } from './browserApi/runtime';
import browserApi from './browserApi';
import { Prefs } from './prefs';
import notifier from '../lib/notifier';

const VIEWED_NOTIFICATIONS = 'viewed-notifications';
const LAST_NOTIFICATION_TIME = 'viewed-notification-time';

const halloweenNotification = {
    id: 'halloween2020',
    locales: {
        en: {
            btn: 'Get a treat',
        },
        de: {
            btn: 'Angebot holen',
        },
        ko: {
            btn: '더 읽기',
        },
        ru: {
            btn: 'Кое-что для вас',
        },
        ja: {
            btn: '秘密の◯◯はこちら',
        },
        zh_cn: {
            btn: '万圣节的魔法',
        },
        zh_tw: {
            btn: '萬聖節的魔法',
        },
        fr: {
            btn: 'Prix promo',
        },
        it: {
            btn: 'Offerta speciale',
        },
    },
    text: '',
    url: 'https://adguard-vpn.com/forward.html?action=halloween2020_notify&from=popup&app=vpn_extension',
    from: '30 October 2020 00:00:01',
    to: '3 November 2020 23:59:00',
    type: 'animated',
    get icons() {
        return lazyGet(halloweenNotification, 'icons', () => ({
            ENABLED: {
                19: getUrl('assets/images/icons/enabled-19-halloween.png'),
                38: getUrl('assets/images/icons/enabled-38-halloween.png'),
            },
            DISABLED: {
                19: getUrl('assets/images/icons/disabled-19-halloween.png'),
                38: getUrl('assets/images/icons/disabled-38-halloween.png'),
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
    halloween2020: halloweenNotification,
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
