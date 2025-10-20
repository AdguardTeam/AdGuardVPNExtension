/**
 * This module manages promo notifications
 */
import browser from 'webextension-polyfill';

import { getForwarderUrl } from '../common/helpers';
import { type IconVariants, Prefs } from '../common/prefs';
import { normalizeLanguage } from '../common/utils/promo';
import { notifier } from '../common/notifier';
import promoBannerImageUrl from '../assets/images/halloween25.svg';

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

const TDS_PROMO_ACTION = 'halloween_25_vpn';

const COMMON_PROMO_URL_QUERY = `action=${TDS_PROMO_ACTION}&from=popup&app=vpn_extension`;

const HALLOWEEN_25_ID = 'halloween25';

const Halloween25Notification = {
    id: HALLOWEEN_25_ID,
    locales: {
        en: {
            title: 'Buy with discount, win Golden Ticket',
            btn: 'Grab the deal',
        },
        fr: {
            title: 'Achetez avec une remise, gagnez un billet doré',
            btn: 'Profitez de l\'offre',
        },
        it: {
            title: 'Acquista con lo sconto, ricevi il biglietto d\'oro',
            btn: 'Tenta la fortuna',
        },
        de: {
            title: 'Mit Rabatt kaufen — Goldticket gewinnen',
            btn: 'Angebot holen',
        },
        // ru: {
        //     title: 'Купите со скидкой — выиграйте золотой билет',
        //     btn: 'Испытать удачу',
        // },
        es: {
            title: 'Compra con descuento, gana un boleto dorado',
            btn: 'Aprovechar la oferta',
        },
        es_419: {
            title: 'Compra con descuento, gana un boleto dorado',
            btn: 'Aprovechar la oferta',
        },
        pt_pt: {
            title: 'Compre com desconto, ganhe um bilhete dourado',
            btn: 'Aproveitar a oferta',
        },
        pt_br: {
            title: 'Compre com desconto, ganhe um bilhete dourado',
            btn: 'Aproveitar a oferta',
        },
        zh_cn: {
            title: '限时特价期间购买 即有机会抽中金奖券',
            btn: '试试手气',
        },
        zh_tw: {
            title: '限時特價期間購買 即有機會抽中金獎券喔',
            btn: '試試手氣',
        },
        ja: {
            title: '特価で購入すれば、抽選でゴールデン チケットが当たる',
            btn: '運を試す',
        },
        ko: {
            title: '할인받고 골든 티켓을 잡으세요!',
            btn: '할인 받기',
        },
        uk: {
            title: 'Купуй зі знижкою — вигравай золотий квиток',
            btn: 'Спробуй удачу',
        },
        ar: {
            title: 'اشترِ بخصم واربح تذكرة ذهبية',
            btn: 'اغتنم العرض',
        },
        be: {
            title: 'Купляй са зніжкай і выйграй залаты білет',
            btn: 'Паспрабаваць удачу',
        },
        bg: {
            title: 'Купи с отстъпка и спечели златен билет',
            btn: 'Опита късмета',
        },
        ca: {
            title: 'Compra amb descompte i prova sort',
            btn: 'Aprofita l\'oferta',
        },
        cs: {
            title: 'Kup se slevou a vyhraj zlatou vstupenku',
            btn: 'Zkusit štěstí',
        },
        da: {
            title: 'Køb med rabat og vind en gylden billet',
            btn: 'Prøve lykken',
        },
        el: {
            title: 'Κερδίστε Χρυσό Εισιτήριο με έκπτωση',
            btn: 'Αποκτήστε έκπτωση',
        },
        fa: {
            title: 'با تخفیف بخر و بلیط طلایی برنده شو',
            btn: 'امتحان کردن شانس',
        },
        fi: {
            title: 'Osta alennuksella ja voita kultainen lippu',
            btn: 'Kokeilla onnea',
        },
        he: {
            title: 'קנו בהנחה וזכו בכרטיס זהב',
            btn: 'לנסות מזל',
        },
        hr: {
            title: 'Kupi s popustom i osvoji zlatnu kartu',
            btn: 'Okušati sreću',
        },
        hu: {
            title: 'Vásárolj kedvezménnyel és nyerj aranyjegyet',
            btn: 'Kipróbálni szerencsét',
        },
        hy: {
            title: 'Գնիր զեղչով և շահիր ոսկե տոմս',
            btn: 'Փորձել բախտը',
        },
        id: {
            title: 'Beli dengan diskon dan menangkan tiket emas',
            btn: 'Coba keberuntungan',
        },
        lt: {
            title: 'Pirk su nuolaida ir laimėk auksinį bilietą',
            btn: 'Išbandyti sėkmę',
        },
        ms: {
            title: 'Beli dengan diskaun dan menangi tiket emas',
            btn: 'Cuba nasib',
        },
        nb: {
            title: 'Kjøp med rabatt og vinn en gullbillett',
            btn: 'Prøve lykken',
        },
        nl: {
            title: 'Koop met korting en win een gouden ticket',
            btn: 'Proberen geluk',
        },
        pl: {
            title: 'Kup ze zniżką i wygraj złoty bilet',
            btn: 'Spróbować szczęścia',
        },
        ro: {
            title: 'Cumpără cu reducere și câștigă',
            btn: 'Încerca norocul',
        },
        sk: {
            title: 'Kúp so zľavou a vyhraj zlatý lístok',
            btn: 'Skúsiť šťastie',
        },
        sl: {
            title: 'Kupite s popustom in osvojite zlato vstopnico',
            btn: 'Preizkusiti srečo',
        },
        sr_latn: {
            title: 'Kupi sa popustom i osvoji zlatnu kartu',
            btn: 'Oprobati sreću',
        },
        sv: {
            title: 'Köp med rabatt och vinn en gyllene biljett',
            btn: 'Prova lyckan',
        },
        tr: {
            title: 'İndirimle satın al ve altın bilet kazan',
            btn: 'Şansı denemek',
        },
        vi: {
            title: 'Mua với giá giảm và trúng vé vàng',
            btn: 'Thử vận may',
        },
        mk: {
            title: 'Купи со попуст и освои златен билет',
            btn: 'Обиди ја среќата',
        },
    },
    // will be selected for locale, see usage of getNotificationText
    text: null,
    urlQuery: COMMON_PROMO_URL_QUERY,
    from: '25 October 2025 12:00:00',
    to: '31 October 2025 23:59:00',
    type: 'animated',
    bgImage: promoBannerImageUrl,
    // TODO: use lazyGet() if promo should not be different for different locales,
    // otherwise it will not work on variable re-assignment
    icons: {
        ENABLED: {
            19: getUrl('assets/images/icons/halloween25-on-19.png'),
            38: getUrl('assets/images/icons/halloween25-on-38.png'),
        },
        DISABLED: {
            19: getUrl('assets/images/icons/halloween25-off-19.png'),
            38: getUrl('assets/images/icons/halloween25-off-38.png'),
        },
    },
};

const notifications: { [key: string]: PromoNotificationData } = {
    [HALLOWEEN_25_ID]: Halloween25Notification,
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
