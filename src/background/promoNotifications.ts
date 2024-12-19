/**
 * This module manages promo notifications
 */
import browser from 'webextension-polyfill';

import { getForwarderUrl } from '../common/helpers';
import { type IconVariants, Prefs } from '../common/prefs';
import { isRuLocale, normalizeLanguage } from '../common/utils/promo';
import { notifier } from '../common/notifier';

import { getUrl } from './browserApi/runtime';
import { browserApi } from './browserApi';
import { forwarder } from './forwarder';

interface PromoNotificationInterface {
    getCurrentNotification(): Promise<PromoNotificationData | null>;
    setNotificationViewed(withDelay: boolean): Promise<void>;
}

/**
 * Notification text record for localizations.
 */
type NotificationTextRecord = {
    title: string,
    btn: string,
};

export interface PromoNotificationData {
    id: string;
    locales: Record<string, NotificationTextRecord>
    text: null | {
        title: string,
        btn: string,
    };

    /**
     * URL for the promo.
     *
     * **Should be generated and set** during {@link getCurrentNotification}.
     */
    url?: string;

    /**
     * Query string for the promo URL.
     *
     * Should be used for the promo URL update.
     */
    urlQuery: string;

    from: string;
    to: string;
    type: string;

    /**
     * Path to the background image for the promo.
     * May be needed for different promos for different locales at the same time.
     */
    bgImage: string,

    icons: IconVariants,
}

const CHECK_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

const MIN_PERIOD_MS = 30 * 60 * 1000; // 30 minutes

const NOTIFICATION_DELAY_MS = 30 * 1000; // clear notification in 30 seconds

const VIEWED_NOTIFICATIONS = 'viewed-notifications';
const LAST_NOTIFICATION_TIME = 'viewed-notification-time';

const TDS_PROMO_ACTION = 'christmas_24_vpn';
const TDS_PROMO_ACTION_RU = 'christmas_24_vpn_ru';

const COMMON_PROMO_URL_QUERY = `action=${TDS_PROMO_ACTION}&from=popup&app=vpn_extension`;
const RU_PROMO_URL_QUERY = `action=${TDS_PROMO_ACTION_RU}&from=popup&app=vpn_extension`;

const urlQuery = isRuLocale
    ? RU_PROMO_URL_QUERY
    : COMMON_PROMO_URL_QUERY;

const CHRISTMAS_24_ID = 'christmas24';

const christmas24Notification = {
    id: CHRISTMAS_24_ID,
    locales: {
        en: {
            title: 'Christmas promo',
            btn: 'Get 80% off',
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
        ru: {
            title: 'Новогодняя акция',
            btn: 'Скидка 75%',
        },
        es: {
            title: 'Promo navideña',
            btn: '80% de descuento',
        },
        es_419: {
            title: 'Promo navideña',
            btn: '80% de descuento',
        },
        pt_pt: {
            title: 'Promo de Natal',
            btn: '80% de desconto',
        },
        pt_br: {
            title: 'Promo de Natal',
            btn: '80% de desconto',
        },
        zh_cn: {
            title: 'AdGuard Christmas SALE',
            btn: '大优惠',
        },
        zh_tw: {
            title: 'AdGuard Christmas SALE',
            btn: '大折扣',
        },
        ja: {
            title: 'AdGuard Christmas SALE',
            btn: '80%OFF割引をGET',
        },
        ko: {
            title: '크리스마스  프로모션',
            btn: '80% 할인',
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
            title: "Venda de Cap d'Any",
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
            title: 'Karácsonyi akció',
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
            title: 'Kerstpromo',
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
        mk: {
            title: 'Новогодишна промоција',
            btn: 'Попуст од 80%',
        },
    },
    // will be selected for locale, see usage of getNotificationText
    text: null,
    urlQuery,
    from: '23 December 2024 12:00:00',
    to: '3 January 2025 23:59:00',
    type: 'animated',
    // TODO: use lazyGet() if promo should not be different for different locales,
    // otherwise it will not work on variable re-assignment
    bgImage: getUrl('assets/images/christmas24.svg'),
    icons: {
        ENABLED: {
            19: getUrl('assets/images/icons/christmas24-on-19.png'),
            38: getUrl('assets/images/icons/christmas24-on-38.png'),
        },
        DISABLED: {
            19: getUrl('assets/images/icons/christmas24-off-19.png'),
            38: getUrl('assets/images/icons/christmas24-off-38.png'),
        },
    },
};

const notifications: { [key: string]: PromoNotificationData } = {
    [CHRISTMAS_24_ID]: christmas24Notification,
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
 * Handles Spanish locale codes:
 * - for non-Spanish locales, returns the same code;
 * - for Latin American Spanish, e.g. 'es_mx', returns 'es_419';
 * - for Spain Spanish, e.g. 'es_es', returns 'es'.
 *
 * @param normalizedLocale Normalized locale code.
 *
 * @returns Normalized locale code.
 */
const handleSpanishLocale = (normalizedLocale: string): string => {
    const GENERAL_SPANISH_NORMALIZED_CODE = 'es';
    const SPAIN_SPANISH_NORMALIZED_CODE = 'es_es';
    const LATIN_AMERICAN_SPANISH_NORMALIZED_CODE = 'es_419';

    if (!normalizedLocale.startsWith(GENERAL_SPANISH_NORMALIZED_CODE)) {
        return normalizedLocale;
    }

    if (normalizedLocale === GENERAL_SPANISH_NORMALIZED_CODE
        || normalizedLocale === SPAIN_SPANISH_NORMALIZED_CODE) {
        return GENERAL_SPANISH_NORMALIZED_CODE;
    }

    return LATIN_AMERICAN_SPANISH_NORMALIZED_CODE;
};

/**
 * Scans notification locales and returns the one matching navigator.language
 * @param notification notification object
 * returns matching text or null
 */
const getNotificationText = (notification: PromoNotificationData): NotificationTextRecord | null => {
    let language = normalizeLanguage(browser.i18n.getUILanguage());

    if (!language) {
        return null;
    }

    language = handleSpanishLocale(language);

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

    // do not display notification on Mobile Edge
    const isAndroid = await Prefs.isAndroid();
    if (isAndroid) {
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

    const forwarderDomain = await forwarder.updateAndGetDomain();

    for (let i = 0; i < notificationsKeys.length; i += 1) {
        const notificationKey = notificationsKeys[i];
        const notification = notifications[notificationKey];

        // set the promo url
        notification.url = getForwarderUrl(forwarderDomain, notification.urlQuery);

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
