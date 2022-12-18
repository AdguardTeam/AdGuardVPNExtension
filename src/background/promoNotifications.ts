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
import { alarmService } from './alarmService';

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

const CLEAR_NOTIFICATION_ALARM_NAME = 'clearNotificationAlarm';

const RUSSIAN_LOCALE = 'ru';

const COMMON_PROMO_LINK = `https://${FORWARDER_DOMAIN}/forward.html?action=xmas_promo_23_vpn&from=popup&app=vpn_extension`;
const RUSSIAN_PROMO_LINK = `https://${FORWARDER_DOMAIN}/forward.html?action=xmas_promo_23_vpn_ru&from=popup&app=vpn_extension`;

const normalizeLanguage = (locale: string): string | null => {
    if (!locale) {
        return null;
    }

    return locale.toLowerCase().replace('-', '_');
};

const currentLocale = normalizeLanguage(browser.i18n.getUILanguage());
const promoLink = currentLocale === RUSSIAN_LOCALE ? RUSSIAN_PROMO_LINK : COMMON_PROMO_LINK;

const xmasPromo23Notification = {
    id: 'xmasPromo23',
    locales: {
        en: {
            title: 'Ho-ho-holiday sale!',
            btn: 'Get 80% off',
        },
        ru: {
            title: 'Новогодние скидки',
            btn: 'Вжух! И -75%',
        },
        ja: {
            title: 'AdGuard Christmas SALE',
            btn: '80%OFF割引をGETする',
        },
        ko: {
            title: '크리스마스 세일',
            btn: '80% 할인',
        },
        es: {
            title: 'Promo navideña',
            btn: 'Descuento de 80%',
        },
        de: {
            title: 'AdGuards Weihnachtsangebot',
            btn: '80% Rabatt',
        },
        pt_pt: {
            title: 'Promo de Natal',
            btn: 'Desconto de 80%',
        },
        pt_br: {
            title: 'Promo de Natal',
            btn: 'Desconto de 80%',
        },
        zh_tw: {
            title: 'AdGuard 聖誕折扣',
            btn: '低至2折',
        },
        zh_cn: {
            title: 'AdGuard 圣诞优惠',
            btn: '低至2折',
        },
        fr: {
            title: 'Promo de Noël chez AdGuard',
            btn: '80% de remise',
        },
        it: {
            title: 'Promo di Natale ad AdGuard',
            btn: '80% di sconto',
        },
        uk: {
            title: 'Новорічний розпродаж',
            btn: 'Знижка 80%',
        },
        ar: {
            title: 'تخفيضات العام الجديد',
            btn: 'خصم 80٪',
        },
        be: {
            title: 'Навагоднія скідкі',
            btn: '80% зніжка',
        },
        bg: {
            title: 'Новогодишни отстъпки',
            btn: '80% отстъпка',
        },
        ca: {
            title: 'Venda de Cap d\'Any',
            btn: '80% de descompte',
        },
        cs: {
            title: 'Novoroční výprodej',
            btn: '80% sleva',
        },
        da: {
            title: 'Nytårsudsalg',
            btn: '80% rabat',
        },
        el: {
            title: 'Εκπτώσεις Πρωτοχρονιάς',
            btn: '80% έκπτωση',
        },
        fa: {
            title: 'فروش سال نو',
            btn: '80٪ تخفیف',
        },
        fi: {
            title: 'Uudenvuoden alennus',
            btn: '80% alennus',
        },
        he: {
            title: 'מבצע לשנה החדשה',
            btn: '80% הנחה',
        },
        hr: {
            title: 'Novogodišnji popusti',
            btn: '80% popusta',
        },
        hu: {
            title: 'Újévi akció',
            btn: '80% kedvezmény',
        },
        hy: {
            title: 'Ամանորյա զեղչեր',
            btn: '80% զեղչ',
        },
        id: {
            title: 'Obral Tahun Baru',
            btn: 'Diskon 80%',
        },
        lt: {
            title: 'Naujųjų metų nuolaidos',
            btn: '80% nuolaida',
        },
        ms: {
            title: 'Jualan Tahun Baru',
            btn: 'Diskaun 80%',
        },
        nb: {
            title: 'Nyttårs salg',
            btn: '80% rabatt',
        },
        nl: {
            title: 'Nieuwjaarsuitverkoop',
            btn: '80% korting',
        },
        pl: {
            title: 'Zniżki noworoczne',
            btn: '80% zniżki',
        },
        ro: {
            title: 'Vânzarea de Anul Nou',
            btn: '80% reducere',
        },
        sk: {
            title: 'Novoročný výpredaj',
            btn: '80% zľava',
        },
        sl: {
            title: 'Novoletni popusti',
            btn: '80% popust',
        },
        sr: {
            title: 'Novogodišnji popusti',
            btn: '80% popusta',
        },
        sv: {
            title: 'Nyårsrabatter',
            btn: '80% rabatt',
        },
        tr: {
            title: 'Yılbaşı indirimleri',
            btn: '%80 indirim',
        },
        vi: {
            title: 'Giảm giá năm mới',
            btn: 'Giảm giá 80%',
        },
    },
    // will be selected for locale, see usage of getNotificationText
    text: null,
    url: promoLink,
    from: '22 December 2022 15:00:00',
    to: '02 January 2023 23:59:00',
    type: 'animated',
    get icons() {
        return lazyGet(xmasPromo23Notification, 'icons', () => ({
            ENABLED: {
                19: getUrl('assets/images/icons/xmas23-on-19.png'),
                38: getUrl('assets/images/icons/xmas23-on-38.png'),
            },
            DISABLED: {
                19: getUrl('assets/images/icons/xmas23-off-19.png'),
                38: getUrl('assets/images/icons/xmas23-off-38.png'),
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
    xmasPromo23: xmasPromo23Notification,
};

/**
 * Gets the last time a notification was shown.
 * If it was not shown yet, initialized with the current time.
 */
const getLastNotificationTime = async (): Promise<number> => {
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

/**
 * Marks current notification as viewed
 * @param {boolean} withDelay if true, do this after a 30 sec delay
 */
const setNotificationViewed = async (withDelay: boolean): Promise<void> => {
    if (withDelay) {
        await alarmService.clearAlarm(CLEAR_NOTIFICATION_ALARM_NAME);
        alarmService.createAlarm(CLEAR_NOTIFICATION_ALARM_NAME, NOTIFICATION_DELAY);
        alarmService.onAlarmFires(CLEAR_NOTIFICATION_ALARM_NAME, () => setNotificationViewed(false));
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

export const promoNotifications: PromoNotificationInterface = {
    getCurrentNotification,
    setNotificationViewed,
};
