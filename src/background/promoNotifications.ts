/**
 * This module manages promo notifications
 */
import browser from 'webextension-polyfill';

import { getForwarderUrl } from '../common/helpers';
import { type IconVariants, Prefs } from '../common/prefs';
import { normalizeLanguage } from '../common/utils/promo';
import { notifier } from '../common/notifier';
import promoBannerImageUrl from '../assets/images/birthday25.svg';

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

const TDS_PROMO_ACTION = 'birthday_25_vpn';

const COMMON_PROMO_URL_QUERY = `action=${TDS_PROMO_ACTION}&from=popup&app=vpn_extension`;

const BIRTHDAY_25_ID = 'birthday25';

const birthday25Notification = {
    id: BIRTHDAY_25_ID,
    locales: {
        en: {
            title: '16 years. One big sale',
            btn: 'Discover deals',
        },
        fr: {
            title: '16 ans, une offre promo',
            btn: 'Voir les détails',
        },
        it: {
            title: "16 anni. Un'offerta",
            btn: 'Scopri di più',
        },
        de: {
            title: 'Geburtstagsspecial: Große Rabatte',
            btn: 'Schnappen',
        },
        ru: {
            title: 'История, которая закончится скидкой',
            btn: 'Узнать',
        },
        es: {
            title: '16 añitos, una súper oferta',
            btn: 'Descubrir',
        },
        es_419: {
            title: '16 añitos, una súper oferta',
            btn: 'Descubrir',
        },
        pt_pt: {
            title: '16 aninhos, 1 ofertão',
            btn: 'Descobrir',
        },
        pt_br: {
            title: '16 aninhos, 1 ofertão',
            btn: 'Descobrir',
        },
        zh_cn: {
            title: '16周年庆',
            btn: '抢购优惠',
        },
        zh_tw: {
            title: '16周年慶',
            btn: '搶購折扣',
        },
        ja: {
            title: 'AdGuard 16周年セール',
            btn: 'セール内容はこちら',
        },
        ko: {
            title: '16주년 기념 세일',
            btn: '자세히 알아보기',
        },
        uk: {
            title: '16 років. Великий розпродаж',
            btn: 'Дізнатись',
        },
        ar: {
            title: 'قصة تنتهي بخصم',
            btn: 'اكتشف العروض',
        },
        be: {
            title: '16 гадоў. Вялікі распродаж',
            btn: 'Знайсці прапановы',
        },
        bg: {
            title: '16 години. Голямо намаление',
            btn: 'Открий оферти',
        },
        ca: {
            title: '16 anys. Gran rebaixa',
            btn: 'Descobreix ofertes',
        },
        cs: {
            title: '16 let. Velký výprodej',
            btn: 'Objevte nabídky',
        },
        da: {
            title: '16 år. Stort udsalg',
            btn: 'Opdag tilbud',
        },
        el: {
            title: 'Ιστορία με έκπτωση',
            btn: 'Μάθετε',
        },
        fa: {
            title: 'داستانی با تخفیف',
            btn: 'کشف تخفیف‌ها',
        },
        fi: {
            title: '16 vuotta. Suuri alennus',
            btn: 'Löydä tarjoukset',
        },
        he: {
            title: 'סיפור עם הנחה',
            btn: 'גלה מבצעים',
        },
        hr: {
            title: '16 godina. Velika rasprodaja',
            btn: 'Otkrij ponude',
        },
        hu: {
            title: 'Történet kedvezménnyel',
            btn: 'Tudj meg',
        },
        hy: {
            title: 'Պատմություն զեղչով',
            btn: 'Բացահայտել',
        },
        id: {
            title: '16 tahun. Diskon besar',
            btn: 'Temukan penawaran',
        },
        lt: {
            title: '16 metų. Didelis išpardavimas',
            btn: 'Atrask pasiūlymus',
        },
        ms: {
            title: '16 tahun. Jualan besar',
            btn: 'Temui tawaran',
        },
        nb: {
            title: '16 år. Stort salg',
            btn: 'Oppdag tilbud',
        },
        nl: {
            title: '16 jaar. Grote uitverkoop',
            btn: 'Ontdek aanbiedingen',
        },
        pl: {
            title: '16 lat. Wielka wyprzedaż',
            btn: 'Odkryj oferty',
        },
        ro: {
            title: '16 ani. Reducere mare',
            btn: 'Descoperă oferte',
        },
        sk: {
            title: '16 rokov. Veľký výpredaj',
            btn: 'Objavte ponuky',
        },
        sl: {
            title: '16 let. Velika razprodaja',
            btn: 'Odkrijte ponudbe',
        },
        sr_latn: {
            title: '16 godina. Velika rasprodaja',
            btn: 'Otkrij ponude',
        },
        sv: {
            title: '16 år. Stor rea',
            btn: 'Se erbjudanden',
        },
        tr: {
            title: '16 yıl. Büyük indirim',
            btn: 'Fırsatları keşfet',
        },
        vi: {
            title: '16 năm. Giảm giá lớn',
            btn: 'Khám phá ưu đãi',
        },
        mk: {
            title: '16 години. Голема распродажба',
            btn: 'Откриј понуди',
        },
    },
    // will be selected for locale, see usage of getNotificationText
    text: null,
    urlQuery: COMMON_PROMO_URL_QUERY,
    from: '30 May 2025 12:00:00',
    to: '5 June 2025 23:59:00',
    type: 'animated',
    bgImage: promoBannerImageUrl,
    // TODO: use lazyGet() if promo should not be different for different locales,
    // otherwise it will not work on variable re-assignment
    icons: {
        ENABLED: {
            19: getUrl('assets/images/icons/birthday25-on-19.png'),
            38: getUrl('assets/images/icons/birthday25-on-38.png'),
        },
        DISABLED: {
            19: getUrl('assets/images/icons/birthday25-off-19.png'),
            38: getUrl('assets/images/icons/birthday25-off-38.png'),
        },
    },
};

const notifications: { [key: string]: PromoNotificationData } = {
    [BIRTHDAY_25_ID]: birthday25Notification,
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
