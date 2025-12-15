/**
 * This module manages promo notifications
 */
import browser from 'webextension-polyfill';

import { getForwarderUrl } from '../common/helpers';
import { type IconVariants, Prefs } from '../common/prefs';
import { isRuLocale, normalizeLanguage } from '../common/utils/promo';
import { notifier } from '../common/notifier';
import promoBannerImageUrl from '../assets/images/newyear25.svg';

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

const TDS_PROMO_ACTION = 'new_year_25_vpn';
const TDS_PROMO_ACTION_RU = 'new_year_25_vpn_ru';

const COMMON_PROMO_URL_QUERY = `action=${TDS_PROMO_ACTION}&from=popup&app=vpn_extension`;
const RU_PROMO_URL_QUERY = `action=${TDS_PROMO_ACTION_RU}&from=popup&app=vpn_extension`;

const urlQuery = isRuLocale
    ? RU_PROMO_URL_QUERY
    : COMMON_PROMO_URL_QUERY;

const dateTo = isRuLocale
    ? '3 January 2026 23:59:00'
    : '1 January 2026 23:59:00';

const NEW_YEAR_25_ID = 'newYear25';

const newYear25Notification = {
    id: NEW_YEAR_25_ID,
    locales: {
        en: {
            title: 'Glam up your protection',
            btn: 'Get 80% off',
        },
        fr: {
            title: 'Sublimez votre protection',
            btn: '80% de remise',
        },
        it: {
            title: 'Un tocco di glamour per la protezione',
            btn: '80% di sconto',
        },
        de: {
            title: 'Strahlende \nVPN-Power',
            btn: '80% Rabatt',
        },
        ru: {
            title: 'Не светитесь в интернете',
            btn: '–75% на VPN',
        },
        es: {
            title: 'Enciende tu protección',
            btn: 'Obtener 80% off',
        },
        es_419: {
            title: 'Enciende tu protección',
            btn: 'Obtener 80% off',
        },
        pt_pt: {
            title: 'Brilhe protegido',
            btn: 'Obter 80% off',
        },
        pt_br: {
            title: 'Brilhe protegido',
            btn: 'Obter 80% off',
        },
        zh_cn: {
            title: '升级防护，畅享清爽浏览',
            btn: '抢先锁定 80%OFF',
        },
        zh_tw: {
            title: '升級防護，暢享清爽瀏覽',
            btn: '搶先鎖定 80%OFF',
        },
        ja: {
            title: 'クリスマスセール',
            btn: '80%OFF割引をGET',
        },
        ko: {
            title: '크리스마스  프로모션',
            btn: '80% 할인',
        },
        uk: {
            title: 'Прокачайте свій захист',
            btn: 'Отримайте –80%',
        },
        ar: {
            title: 'زوّد حمايتك',
            btn: '٪80 احصل على خصم',
        },
        be: {
            title: 'Узмацніце сваю абарону',
            btn: '80% зніжка',
        },
        bg: {
            title: 'Укрепете \nи озарете защитата си',
            btn: '80% отстъпка',
        },
        ca: {
            title: 'Millora la protecció',
            btn: '80% de descompte',
        },
        cs: {
            title: 'Dodejte ochraně lesk',
            btn: '80% sleva',
        },
        da: {
            title: 'Pift din beskyttelse op',
            btn: 'Få 80% rabat',
        },
        el: {
            title: 'Εκπτώσεις Πρωτοχρονιάς',
            btn: '80% έκπτωση',
        },
        fa: {
            title: 'محافظتت را زیبا کن',
            btn: '٪80 دریافت تخفیف',
        },
        fi: {
            title: 'Korosta suojauksesi tyyliä',
            btn: 'Saat 80% alennusta',
        },
        he: {
            title: 'תן סטייל להגנה שלך',
            btn: 'קבל 80% הנחה',
        },
        hr: {
            title: 'Pojačajte zaštitu',
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
            title: 'Perindah proteksimu',
            btn: 'Dapatkan 80% diskon',
        },
        lt: {
            title: 'Pagerink savo apsaugą',
            btn: 'Gauk 80% nuolaidą',
        },
        ms: {
            title: 'Jualan Tahun Baru',
            btn: 'Diskaun 80%',
        },
        nb: {
            title: 'Gi beskyttelsen din glans',
            btn: 'Få 80% rabatt',
        },
        nl: {
            title: 'Boost je bescherming',
            btn: 'Krijg 80% korting',
        },
        pl: {
            title: 'Dodajcie blask ochronie',
            btn: 'Zgarnij 80% zniżki',
        },
        ro: {
            title: 'Fă-ți protecția stilată',
            btn: 'Ia 80% reducere',
        },
        sk: {
            title: 'Dodajte lesk ochrane',
            btn: '80% zľava',
        },
        sl: {
            title: 'Dodajte sij zaščiti',
            btn: '80% popust',
        },
        sr_latn: {
            title: 'Dajte zaštiti sjaj',
            btn: '80% popusta',
        },
        sv: {
            title: 'Boost din skydd',
            btn: 'Få 80% rabatt',
        },
        tr: {
            title: 'Korumanı \nstilize et',
            btn: '%80 indirim al',
        },
        vi: {
            title: 'Trang bị bảo vệ của bạn',
            btn: 'Nhận 80% giảm giá',
        },
        mk: {
            title: 'Дајте сјај на заштитата',
            btn: 'Попуст од 80%',
        },
    },
    // will be selected for locale, see usage of getNotificationText
    text: null,
    urlQuery,
    from: '22 December 2025 12:00:00',
    to: dateTo,
    type: 'animated',
    bgImage: promoBannerImageUrl,
    // TODO: use lazyGet() if promo should not be different for different locales,
    // otherwise it will not work on variable re-assignment
    icons: {
        ENABLED: {
            19: getUrl('assets/images/icons/newyear25-on-19.png'),
            38: getUrl('assets/images/icons/newyear25-on-38.png'),
        },
        DISABLED: {
            19: getUrl('assets/images/icons/newyear25-off-19.png'),
            38: getUrl('assets/images/icons/newyear25-off-38.png'),
        },
    },
};

const notifications: { [key: string]: PromoNotificationData } = {
    [NEW_YEAR_25_ID]: newYear25Notification,
};

/**
 * Gets the last time a notification was shown.
 * If it was not shown yet, initialized with the current time.
 *
 * @returns Last notification time.
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
 * Scans notification locales and returns the one matching navigator language.
 *
 * @param notification Notification object.
 *
 * @returns Matching text or null if no language defined.
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
 * Finds out notification for current time and checks if notification wasn't shown yet.
 *
 * @returns Notification if it has to be shown.
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
