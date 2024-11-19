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

const TDS_PROMO_ACTION = 'black_friday_24_vpn';
const TDS_PROMO_ACTION_RU = 'black_friday_24_vpn_ru';

const COMMON_PROMO_URL_QUERY = `action=${TDS_PROMO_ACTION}&from=popup&app=vpn_extension`;
const RU_PROMO_URL_QUERY = `action=${TDS_PROMO_ACTION_RU}&from=popup&app=vpn_extension`;

const urlQuery = isRuLocale
    ? RU_PROMO_URL_QUERY
    : COMMON_PROMO_URL_QUERY;

const BLACK_FRIDAY_24_ID = 'blackFriday24';

const blackFriday24Notification = {
    id: BLACK_FRIDAY_24_ID,
    locales: {
        en: {
            title: 'Greatest sale of the year',
            btn: 'Get 85% off',
        },
        fr: {
            title: "La grande promo de l'année",
            btn: 'Obtenez -85%',
        },
        it: {
            title: "La vendita maggiore dell'anno",
            btn: 'Ottieni -85%',
        },
        de: {
            title: 'Die besten Deals des Jahres',
            btn: '85% Rabatt',
        },
        ru: {
            title: 'Самая большая скидка года',
            btn: '−80% на AdGuard VPN',
        },
        es: {
            title: 'La mejor oferta del año',
            btn: 'Obtener 85% off',
        },
        es_419: {
            title: 'La mayor venta del año',
            btn: '85% de descuento',
        },
        pt_pt: {
            title: 'A melhor oferta do ano',
            btn: 'Obter 85% off',
        },
        pt_br: {
            title: 'A melhor oferta do ano',
            btn: 'Obter 85% off',
        },
        zh_cn: {
            title: '年度最大SALE',
            btn: '85%OFF',
        },
        zh_tw: {
            title: '年末最大折扣',
            btn: '85%OFF',
        },
        ja: {
            title: 'BLACK FRIDAY: 今年最安セール',
            btn: '85%OFF割引をGET',
        },
        ko: {
            title: '올해의 가장 큰 세일',
            btn: '85% 할인',
        },
        uk: {
            title: 'Найбільший розпродаж року',
            btn: 'Знижка 85%',
        },
        ar: {
            title: 'أعظم بيع لهذا العام',
            btn: '٪85 احصل على خصم',
        },
        be: {
            title: 'Самы вялікі распродаж года',
            btn: 'Зніжка 85%',
        },
        bg: {
            title: 'Най-голямата разпродажба на годината',
            btn: '85% отстъпка',
        },
        ca: {
            title: "La venda més gran de l'any",
            btn: '85% de descompte',
        },
        cs: {
            title: 'Největší výprodej roku',
            btn: '85% sleva',
        },
        da: {
            title: 'Årets største salg',
            btn: '85% rabat',
        },
        el: {
            title: 'Η μεγαλύτερη πώληση της χρονιάς',
            btn: '85% έκπτωση',
        },
        fa: {
            title: 'بزرگترین فروش سال',
            btn: '٪85 تخفیف',
        },
        fi: {
            title: 'Vuoden suurin myynti',
            btn: '85% alennus',
        },
        he: {
            title: 'המכירה הגדולה של השנה',
            btn: '85% הנחה',
        },
        hr: {
            title: 'Najveća rasprodaja godine',
            btn: '85% popusta',
        },
        hu: {
            title: 'Az év legnagyobb eladása',
            btn: '85% kedvezmény',
        },
        hy: {
            title: 'Տարվա ամենամեծ վաճառքը',
            btn: '85% զեղչ',
        },
        id: {
            title: 'Penjualan terbesar tahun ini',
            btn: 'Diskon 85%',
        },
        lt: {
            title: 'Didžiausias metų išpardavimas',
            btn: '85% nuolaida',
        },
        ms: {
            title: 'Jualan terhebat pada tahun ini',
            btn: 'Diskaun 85%',
        },
        nb: {
            title: 'Årets største salg',
            btn: '85% rabatt',
        },
        nl: {
            title: 'Grootste uitverkoop van het jaar',
            btn: '85% korting',
        },
        pl: {
            title: 'Największa wyprzedaż roku',
            btn: '85% zniżki',
        },
        ro: {
            title: 'Cea mai mare vânzare a anului',
            btn: '85% reducere',
        },
        sk: {
            title: 'Najväčší predaj roka',
            btn: '85% zľava',
        },
        sl: {
            title: 'Največja prodaja leta',
            btn: '85% popust',
        },
        'sr-Latn': {
            title: 'Najveća prodaja godine',
            btn: '85% popusta',
        },
        sv: {
            title: 'Årets bästa rea',
            btn: '85% rabatt',
        },
        tr: {
            title: 'Yılın en büyük satışı',
            btn: '%85 indirim',
        },
        vi: {
            title: 'Khuyến mại lớn nhất trong năm',
            btn: 'Giảm giá 85%',
        },
        mk: {
            title: 'Најголемиот попуст на годината',
            btn: '−85% на AdGuard VPN',
        },
    },
    // will be selected for locale, see usage of getNotificationText
    text: null,
    urlQuery,
    from: '25 November 2024 12:00:00',
    to: '6 December 2024 23:59:00',
    type: 'animated',
    // TODO: use lazyGet() if promo should not be different for different locales,
    // otherwise it will not work on variable re-assignment
    bgImage: getUrl('assets/images/blackfriday24.svg'),
    icons: {
        ENABLED: {
            19: getUrl('assets/images/icons/blackfriday24-on-19.png'),
            38: getUrl('assets/images/icons/blackfriday24-on-38.png'),
        },
        DISABLED: {
            19: getUrl('assets/images/icons/blackfriday24-off-19.png'),
            38: getUrl('assets/images/icons/blackfriday24-off-38.png'),
        },
    },
};

const notifications: { [key: string]: PromoNotificationData } = {
    [BLACK_FRIDAY_24_ID]: blackFriday24Notification,
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
