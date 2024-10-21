/**
 * This module manages promo notifications
 */
import browser from 'webextension-polyfill';

import { getForwarderUrl } from '../common/helpers';
import { type IconVariants, Prefs } from '../common/prefs';
import { normalizeLanguage } from '../common/utils/promo';
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

const TDS_PROMO_ACTION = 'halloween_24_vpn';

const COMMON_PROMO_URL_QUERY = `action=${TDS_PROMO_ACTION}&from=popup&app=vpn_extension`;

const HALLOWEEN_24_ID = 'halloween24';

const halloween24Notification: PromoNotificationData = {
    id: HALLOWEEN_24_ID,
    locales: {
        en: {
            title: 'The Web is full of dangers',
            btn: 'Get rid of them',
        },
        fr: {
            title: 'Le Web est plein de périls',
            btn: 'Èliminons-les',
        },
        it: {
            title: "L'Internet è pieno di pericoli",
            btn: 'Togliamoli',
        },
        de: {
            title: 'Cybermonster bedrohen das Web!',
            btn: 'Das muss aufhören',
        },
        ru: {
            title: 'Кибернежить нападает!',
            btn: 'Сразиться',
        },
        es: {
            title: 'El internet está lleno de peligros',
            btn: 'Terminarlos',
        },
        es_419: {
            title: 'El internet está lleno de peligros',
            btn: 'Terminarlos',
        },
        pt_pt: {
            title: 'A internet está cheia de monstros',
            btn: 'Acabar com eles',
        },
        pt_br: {
            title: 'A internet está cheia de monstros',
            btn: 'Acabar com eles',
        },
        zh_cn: {
            title: '网络威胁无处不在',
            btn: '立即消除它们',
        },
        zh_tw: {
            title: '網路威脅無處不在',
            btn: '立即消除它們',
        },
        ja: {
            title: 'AdGuardで怪物を 倒すゲーム',
            btn: 'プレイしてみる',
        },
        ko: {
            title: '사이버 몬스터와 싸워보세요!',
            btn: '퀴즈 시작',
        },
        uk: {
            title: 'Інтернет повен небезпек',
            btn: 'Позбудьтесь їх',
        },
        ar: {
            title: '!الإنترنت في خطر',
            btn: 'ساعد',
        },
        be: {
            title: 'Інтэрнэт поўны небяспек',
            btn: 'Пазбаўцеся іх',
        },
        bg: {
            title: 'Интернетът е в опасност!',
            btn: 'Помогнете',
        },
        ca: {
            title: 'Internet està en perill!',
            btn: 'Ajuda',
        },
        cs: {
            title: 'Web je plný nebezpečí',
            btn: 'Zbavte se jich',
        },
        da: {
            title: 'Internettet er fuld af farer',
            btn: 'Slip af med dem',
        },
        el: {
            title: 'Το διαδίκτυο κινδυνεύει!',
            btn: 'Βοήθεια',
        },
        fa: {
            title: '!هیولاها به اینترنت حمله کردند',
            btn: 'مبارزه کنید',
        },
        fi: {
            title: 'Hirviöt hyökkäsivät internetiin!',
            btn: 'Taistele',
        },
        he: {
            title: '!המפלצות תקפו את האינטרנט',
            btn: 'להילחם',
        },
        hr: {
            title: 'Internet je pun opasnosti',
            btn: 'Riješite ih se',
        },
        hu: {
            title: 'Az internet veszélyben van!',
            btn: 'Segíts',
        },
        hy: {
            title: 'Ինտերնետը վտանգի մեջ է',
            btn: 'Օգնեք',
        },
        id: {
            title: 'Monster menyerang internet!',
            btn: 'Bertarung',
        },
        lt: {
            title: 'Monstrai užpuolė internetą!',
            btn: 'Kovoti',
        },
        ms: {
            title: 'Raksasa menyerang internet!',
            btn: 'Lawan',
        },
        nb: {
            title: 'Internett er full av farer',
            btn: 'Bli kvitt dem',
        },
        nl: {
            title: 'Cybermonsters vallen aan!',
            btn: 'Vechten',
        },
        pl: {
            title: 'Potwory zaatakowały internet!',
            btn: 'Walczyć',
        },
        ro: {
            title: 'Monștrii au atacat internetul!',
            btn: 'Luptă',
        },
        sk: {
            title: 'Monštrá zaútočili na internet!',
            btn: 'Bojovať',
        },
        sl: {
            title: 'Splet je poln nevarnosti',
            btn: 'Znebite se jih',
        },
        'sr-Latn': {
            title: 'Monstrumi su napali internet!',
            btn: 'Bori se',
        },
        sv: {
            title: 'Monstren attackerar internet!',
            btn: 'Kämpa',
        },
        tr: {
            title: 'Canavarlar internete saldırdı!',
            btn: 'Savaş',
        },
        vi: {
            title: 'Quái vật đã tấn công internet!',
            btn: 'Chiến đấu',
        },
        hi: {
            title: 'राक्षसों ने इंटरनेट पर हमला किया!',
            btn: 'लड़ो',
        },
        et: {
            title: 'Veeb on täis ohte',
            btn: 'Vabane neist',
        },
        th: {
            title: 'สัตว์ประหลาดโจมตีอินเทอร์เน็ต!',
            btn: 'ต่อสู้',
        },
        mk: {
            title: 'Интернетот е во опасност!',
            btn: 'Помош',
        },
    },
    // will be selected for locale, see usage of getNotificationText
    text: null,
    urlQuery: COMMON_PROMO_URL_QUERY,
    from: '25 October 2024 12:00:00',
    to: '31 October 2024 23:59:00',
    type: 'animated',
    // TODO: use lazyGet() if promo should not be different for different locales,
    // otherwise it will not work on variable re-assignment
    bgImage: getUrl('assets/images/halloween24.svg'),
    icons: {
        ENABLED: {
            19: getUrl('assets/images/icons/halloween24-on-19.png'),
            38: getUrl('assets/images/icons/halloween24-on-38.png'),
        },
        DISABLED: {
            19: getUrl('assets/images/icons/halloween24-off-19.png'),
            38: getUrl('assets/images/icons/halloween24-off-38.png'),
        },
    },
};

const notifications: { [key: string]: PromoNotificationData } = {
    [HALLOWEEN_24_ID]: halloween24Notification,
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
