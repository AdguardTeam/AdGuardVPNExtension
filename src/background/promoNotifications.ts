/**
 * This module manages promo notifications
 */
import browser from 'webextension-polyfill';

import { getForwarderUrl } from '../common/helpers';
import { Prefs } from '../common/prefs';
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

const TDS_PROMO_ACTION = 'easter_24_vpn';
const TDS_PROMO_ACTION_RU = 'easter_24_vpn_ru';

const COMMON_PROMO_URL_QUERY = `action=${TDS_PROMO_ACTION}&from=popup&app=vpn_extension`;
const RU_PROMO_URL_QUERY = `action=${TDS_PROMO_ACTION_RU}&from=popup&app=vpn_extension`;

// possible return values of getUILanguage(): 'ru' or 'ru-RU' which is 'ru_ru' after normalization
const promoUrlQuery = isRuLocale
    ? RU_PROMO_URL_QUERY
    : COMMON_PROMO_URL_QUERY;

/**
 * List of locales for the Spring promo, not the Easter one. AG-31141.
 */
const SPRING_PROMO_LOCALES = [
    'ru',
    'uk',
    'ar',
    'be',
    'bg',
    'el',
    'sr',
    'hy',
    'fa',
    'he',
    'ms',
    'id',
    'tr',
    'vi',
    'zh_cn',
    'zh_tw',
];

const EASTER_24_ID = 'easter24';

let easter24Notification: PromoNotificationData = {
    id: EASTER_24_ID,
    locales: {
        en: {
            title: 'Easter promo',
            btn: 'Get 80% off',
        },
        // there is no promo for Japanese
        // ja: {},
        ko: {
            title: '부활절 세일',
            btn: '80% 할인',
        },
        fr: {
            title: 'Promo de Pâques',
            btn: '80% de remise ici',
        },
        it: {
            title: 'Offerta di Pascua',
            btn: '80% di sconto qui',
        },
        de: {
            title: 'Oster-Sale',
            btn: '80% Rabatt',
        },
        es: {
            title: 'Promo de Pascua',
            btn: 'Obtén un 80% OFF',
        },
        pt_br: {
            title: 'Promo de Páscoa',
            btn: 'Obtenha 80% OFF',
        },
        pt_pt: {
            title: 'Promo de Páscoa',
            btn: 'Obtenha 80% OFF',
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
        es_419: {
            title: 'Promoción de pascua',
            btn: '80% de descuento',
        },
        fi: {
            title: 'Pääsiäispromo',
            btn: '80 % alennus',
        },
        hr: {
            title: 'Uskršnja promocija',
            btn: '80% popusta',
        },
        hu: {
            title: 'Húsvéti promóció',
            btn: '80% kedvezmény',
        },
        lt: {
            title: 'Velykų akcija',
            btn: '80% nuolaida',
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
        sv: {
            title: 'Påsk kampanj',
            btn: '80 % rabatt',
        },
    },
    // will be selected for locale, see usage of getNotificationText
    text: null,
    urlQuery: promoUrlQuery,
    from: '28 March 2024 12:00:00',
    to: '3 April 2024 23:59:00',
    type: 'animated',
    // TODO: use lazyGet() if promo should not be different for different locales,
    // otherwise it will not work on variable re-assignment
    bgImage: getUrl('assets/images/easter24.svg'),
    icons: {
        ENABLED: {
            19: getUrl('assets/images/icons/easter24-on-19.png'),
            38: getUrl('assets/images/icons/easter24-on-38.png'),
        },
        DISABLED: {
            19: getUrl('assets/images/icons/easter24-off-19.png'),
            38: getUrl('assets/images/icons/easter24-off-38.png'),
        },
    },
};

/**
 * Diff data for the Spring promo.
 */
const spring24NotificationUpdateDiff = {
    locales: {
        ar: {
            title: 'ترويج الربيع',
            btn: '٪80 خصم',
        },
        be: {
            title: 'Вясновая акцыя',
            btn: 'Зніжка 80%',
        },
        bg: {
            title: 'Пролетна промоция',
            btn: '80% отстъпка',
        },
        el: {
            title: 'Ανοιξιάτικη προώθηση',
            btn: '80% έκπτωση',
        },
        fa: {
            title: 'تبلیغات بهار',
            btn: '80 درصد تخفیف',
        },
        he: {
            title: 'קידום אביב',
            btn: '80% הנחה',
        },
        hy: {
            title: 'Գարնանային ակցիա',
            btn: '80% զեղչ',
        },
        id: {
            title: 'Promosi musim semi',
            btn: 'Diskon 80%',
        },
        ms: {
            title: 'Promosi musim bunga',
            btn: '80% diskaun',
        },
        ru: {
            title: 'Весенняя акция',
            btn: 'Скидка 75%',
        },
        'sr-Latn': {
            title: 'Prolećna promocija',
            btn: 'Popust 80%',
        },
        tr: {
            title: 'Bahar promosyonu',
            btn: '%80 indirim',
        },
        uk: {
            title: 'Весняна акція',
            btn: 'Знижка 80%',
        },
        vi: {
            title: 'Khuyến mãi mùa xuân',
            btn: 'Giảm giá 80%',
        },
        zh_cn: {
            title: '暖春特惠',
            btn: '享2折',
        },
        zh_tw: {
            title: '暖春優惠',
            btn: '享2折',
        },
    },
    bgImage: getUrl('assets/images/spring24.svg'),
    icons: {
        ENABLED: {
            19: getUrl('assets/images/icons/spring24-on-19.png'),
            38: getUrl('assets/images/icons/spring24-on-38.png'),
        },
        DISABLED: {
            19: getUrl('assets/images/icons/spring24-off-19.png'),
            38: getUrl('assets/images/icons/spring24-off-38.png'),
        },
    },
};

// possible values of browser lang: 'zh-TW' which is 'zh_tw' after normalization
const currentLocale = normalizeLanguage(browser.i18n.getUILanguage());

const shouldShowSpring24Promo = currentLocale
    && SPRING_PROMO_LOCALES.some((locale) => currentLocale.startsWith(locale));

if (shouldShowSpring24Promo) {
    easter24Notification = {
        ...easter24Notification,
        // update the notification data with the Spring promo data
        ...spring24NotificationUpdateDiff,
    };
}

const notifications: { [key: string]: PromoNotificationData } = {
    [EASTER_24_ID]: easter24Notification,
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
