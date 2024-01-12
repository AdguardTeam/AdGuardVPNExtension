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

const RU_LOCALE = 'ru';

const TDS_PROMO_ACTION = 'christmas_23_vpn';
const TDS_PROMO_ACTION_RU = 'christmas_23_vpn_ru';

const COMMON_PROMO_LINK = `https://${FORWARDER_DOMAIN}/forward.html?action=${TDS_PROMO_ACTION}&from=popup&app=vpn_extension`;
const RU_PROMO_LINK = `https://${FORWARDER_DOMAIN}/forward.html?action=${TDS_PROMO_ACTION_RU}&from=popup&app=vpn_extension`;

const normalizeLanguage = (locale: string): string | null => {
    if (!locale) {
        return null;
    }

    return locale.toLowerCase().replace('-', '_');
};

const currentLocale = normalizeLanguage(browser.i18n.getUILanguage());
const isRuLocale = currentLocale?.startsWith(RU_LOCALE);
// possible return values of getUILanguage(): 'ru' or 'ru-RU' which is 'ru_ru' after normalization
const promoLink = isRuLocale
    ? RU_PROMO_LINK
    : COMMON_PROMO_LINK;

const CHRISTMAS_23_ID = 'christmas23';

const christmas23Notification = {
    id: CHRISTMAS_23_ID,
    locales: {
        en: {
            title: 'Christmas promo',
            btn: 'Get 80% off',
        },
        ru: {
            title: 'Новогодняя акция',
            btn: 'Скидка 75%',
        },
        ja: {
            title: 'AdGuard Christmas SALE',
            btn: '80%OFF割引をGET',
        },
        ko: {
            title: '크리스마스  프로모션',
            btn: '80% 할인',
        },
        zh_cn: {
            title: 'AdGuard Christmas SALE',
            btn: '低至2折',
        },
        zh_tw: {
            title: 'AdGuard Christmas SALE',
            btn: '低至2折',
        },
        fr: {
            title: 'Promo Noël chez AdGuard VPN',
            btn: '80% de remise',
        },
        it: {
            title: 'Promo di Natale ad AdGuard VPN',
            btn: '80% di sconto',
        },
        de: {
            title: 'Weihnachtspromo',
            btn: '80% Rabatt',
        },
        es: {
            title: 'Promo navideña',
            btn: '80% de descuento',
        },
        pt_br: {
            title: 'Promo de Natal',
            btn: '80% de desconto',
        },
        pt_pt: {
            title: 'Promo de Natal',
            btn: '80% de desconto',
        },
        uk: {
            title: 'Різдвяна акція',
            btn: 'Знижка 80%',
        },
        ar: {
            title: 'تخفيضات العام الجديد',
            btn: '٪خصم 80',
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
        es_419: {
            title: 'Promo navideña',
            btn: '80% de descuento',
        },
        fa: {
            title: 'فروش سال نو',
            btn: '٪80 خاموش',
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
            title: 'Otvoren',
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
            title: 'Kerst promo',
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
        'sr-Latn': {
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
    from: '22 December 2023 12:00:00',
    to: '1 January 2024 23:59:00',
    type: 'animated',
    get icons() {
        return lazyGet(christmas23Notification, 'icons', () => ({
            ENABLED: {
                19: getUrl('assets/images/icons/christmas23-on-19.png'),
                38: getUrl('assets/images/icons/christmas23-on-38.png'),
            },
            DISABLED: {
                19: getUrl('assets/images/icons/christmas23-off-19.png'),
                38: getUrl('assets/images/icons/christmas23-off-38.png'),
            },
        }));
    },
};

if (isRuLocale) {
    christmas23Notification.to = '8 January 2024 23:59:00';
}

const notifications: { [key: string]: PromoNotificationData } = {
    [CHRISTMAS_23_ID]: christmas23Notification,
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
