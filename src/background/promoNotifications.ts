/**
 * This module manages promo notifications
 */
import browser from 'webextension-polyfill';

import { getForwarderUrl } from '../common/helpers';
import { type IconVariants, Prefs } from '../common/prefs';
import { isRuLocale, normalizeLanguage } from '../common/utils/promo';
import { notifier } from '../common/notifier';
import promoBannerImageUrl from '../assets/images/spring25.svg';

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

const TDS_PROMO_ACTION = 'spring_25_vpn';
const TDS_PROMO_ACTION_RU = 'spring_25_vpn_ru';

const COMMON_PROMO_URL_QUERY = `action=${TDS_PROMO_ACTION}&from=popup&app=vpn_extension`;
const RU_PROMO_URL_QUERY = `action=${TDS_PROMO_ACTION_RU}&from=popup&app=vpn_extension`;

const urlQuery = isRuLocale
    ? RU_PROMO_URL_QUERY
    : COMMON_PROMO_URL_QUERY;

const SPRING_25_ID = 'spring25';

const spring25Notification = {
    id: SPRING_25_ID,
    locales: {
        en: {
            title: 'Spring cleaning promo',
            btn: 'Get 80% off',
        },
        fr: {
            title: 'Promo Printemps',
            btn: '80% de remise ici',
        },
        it: {
            title: 'Offerta di Primavera',
            btn: '80% di sconto qui',
        },
        de: {
            title: 'Aktion zum Frühjahrsputz',
            btn: '80% Rabatt',
        },
        ru: {
            title: 'Весенняя уборка с AdGuard VPN',
            btn: 'Скидка 75%',
        },
        es: {
            title: 'Una oferta especial',
            btn: 'Obtener 80% OFF',
        },
        es_419: {
            title: 'Promoción de limpieza de primavera',
            btn: '80% de descuento',
        },
        pt_pt: {
            title: 'Promoção de primavera',
            btn: 'Obter 80% OFF',
        },
        pt_br: {
            title: 'Promoção de outono',
            btn: 'Obter 80% OFF',
        },
        zh_cn: {
            title: '暖春特惠',
            btn: '80%OFF',
        },
        zh_tw: {
            title: '暖春優惠',
            btn: '享2折',
        },
        // For Japanese, there will be other promo soon
        // ja: {
        //     title: 'AdGuard Christmas SALE',
        //     btn: '80%OFF割引をGET',
        // },
        ko: {
            title: '봄맞이 할인 프로모션',
            btn: '80% 할인',
        },
        uk: {
            title: 'Весняне прибирання з AdGuard VPN',
            btn: 'Знижка 80%',
        },
        ar: {
            title: 'تنظيف الربيع مع AdGuard VPN',
            btn: '80٪ خصم',
        },
        be: {
            title: 'Вясновае ўборка з AdGuard VPN',
            btn: 'Зніжка 80%',
        },
        bg: {
            title: 'Пролетно почистване с AdGuard VPN',
            btn: '80% отстъпка',
        },
        ca: {
            title: 'Neteja de primavera amb AdGuard VPN',
            btn: '80% de descompte',
        },
        cs: {
            title: 'Jarní úklid s AdGuard VPN',
            btn: '80% sleva',
        },
        da: {
            title: 'Forårsrengøring med AdGuard VPN',
            btn: '80% rabat',
        },
        el: {
            title: 'Προσφορά για την άνοιξη',
            btn: '80% έκπτωση',
        },
        fa: {
            title: 'تمیزکاری بهاری با AdGuard VPN',
            btn: '80 درصد تخفیف',
        },
        fi: {
            title: 'Kevätsiivous AdGuard VPN:llä',
            btn: '80% alennus',
        },
        he: {
            title: 'ניקיון אביב עם AdGuard VPN',
            btn: '80% הנחה',
        },
        hr: {
            title: 'Proljetna čišćenje s AdGuard VPN',
            btn: '80% popusta',
        },
        hu: {
            title: 'Tavaszi takarítás AdGuard VPN-nel',
            btn: '80% kedvezmény',
        },
        hy: {
            title: 'Գարնան մաքրագործման պրոմո',
            btn: '80% զեղչ',
        },
        id: {
            title: 'Promosi musim semi',
            btn: 'Diskon 80%',
        },
        lt: {
            title: 'Pavasario valymas su AdGuard VPN',
            btn: '80% nuolaida',
        },
        ms: {
            title: 'Promosi pembersihan musim bunga',
            btn: '80% diskaun',
        },
        nb: {
            title: 'Vår rengjøring med AdGuard VPN',
            btn: '80% rabatt',
        },
        nl: {
            title: 'Lente schoonmaak actie',
            btn: '80% korting',
        },
        pl: {
            title: 'Wiosenna promocja sprzątania',
            btn: '80% zniżki',
        },
        ro: {
            title: 'Promoție de curățenie de primăvară',
            btn: '80% reducere',
        },
        sk: {
            title: 'Jarné upratovanie s AdGuard VPN',
            btn: '80% zľava',
        },
        sl: {
            title: 'Pomladansko čiščenje z AdGuard VPN',
            btn: '80% popust',
        },
        sr_latn: {
            title: 'Prolećno čišćenje sa AdGuard VPN',
            btn: 'Popust 80%',
        },
        sv: {
            title: 'Vårstädning med AdGuard VPN',
            btn: '80% rabatt',
        },
        tr: {
            title: 'Bahar temizlik AdGuard VPN ile',
            btn: '%80 indirim',
        },
        vi: {
            title: 'Dọn dẹp mùa xuân với AdGuard VPN',
            btn: 'Giảm giá 80%',
        },
        mk: {
            title: 'Пролетно чистење со AdGuard VPN',
            btn: 'Попуст од 80%',
        },
    },
    // will be selected for locale, see usage of getNotificationText
    text: null,
    urlQuery,
    from: '28 April 2025 12:00:00',
    to: '4 May 2025 23:59:00',
    type: 'animated',
    bgImage: promoBannerImageUrl,
    // TODO: use lazyGet() if promo should not be different for different locales,
    // otherwise it will not work on variable re-assignment
    icons: {
        ENABLED: {
            19: getUrl('assets/images/icons/spring25-on-19.png'),
            38: getUrl('assets/images/icons/spring25-on-38.png'),
        },
        DISABLED: {
            19: getUrl('assets/images/icons/spring25-off-19.png'),
            38: getUrl('assets/images/icons/spring25-off-38.png'),
        },
    },
};

const notifications: { [key: string]: PromoNotificationData } = {
    [SPRING_25_ID]: spring25Notification,
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
 * Handles Serbian locale codes:
 * - for non-Serbian locales, returns the same code;
 * - for any Serbian, e.g. 'sr', 'sr_latn', 'sr_cyrl_rs', returns 'sr_latn'.
 *
 * @param normalizedLocale Normalized locale code.
 *
 * @returns Normalized locale code.
 */
const handleSerbianLocale = (normalizedLocale: string): string => {
    const GENERAL_SERBIAN_LOCALE = 'sr';
    const GENERAL_SERBIAN_LATIN_LOCALE = 'sr_latn';
    if (normalizedLocale.startsWith(GENERAL_SERBIAN_LOCALE)) {
        return GENERAL_SERBIAN_LATIN_LOCALE;
    }

    return normalizedLocale;
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
    language = handleSerbianLocale(language);

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
