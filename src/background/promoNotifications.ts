/**
 * This module manages promo notifications
 */
import browser from 'webextension-polyfill';

import { getForwarderUrl } from '../common/helpers';
import { Prefs } from '../common/prefs';
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

const TDS_PROMO_ACTION = 'birthday_24_vpn';

const COMMON_PROMO_URL_QUERY = `action=${TDS_PROMO_ACTION}&from=popup&app=vpn_extension`;

const BIRTHDAY_24_ID = 'birthday24';

const birthday24Notification: PromoNotificationData = {
    id: BIRTHDAY_24_ID,
    locales: {
        en: {
            title: 'Would you fit in AdGuard?',
            btn: 'Find out',
        },
        fr: {
            title: 'Qui seriez-vous chez AdGuard ?',
            btn: 'Découvrez-le',
        },
        it: {
            title: 'Chi sarai ad AdGuard ?',
            btn: 'Scoprirlo',
        },
        de: {
            title: 'Wer wären Sie bei AdGuard?',
            btn: 'Herausfinden',
        },
        ru: {
            title: 'Кем бы вы были в AdGuard?',
            btn: 'Узнать',
        },
        es: {
            title: '¿Quién eres en AdGuard?',
            btn: 'Descubrirlo',
        },
        es_419: {
            title: '¿Quién eres en AdGuard?',
            btn: 'Descubrirlo',
        },
        pt_pt: {
            title: 'Quem seria no AdGuard?',
            btn: 'Descobrir',
        },
        pt_br: {
            title: 'Quem é você no AdGuard?',
            btn: 'Descobrir',
        },
        zh_cn: {
            title: '如果你在 AdGuard 工作',
            btn: '你的岗位会是...',
        },
        zh_tw: {
            title: '如果您在 AdGuard 工作',
            btn: '您的崗位會是...',
        },
        ja: {
            title: 'あなたが AdGuard メンバーだったら？',
            btn: 'おもしろアンケート',
        },
        ko: {
            title: '여러분이 AdGuard 직원이라면?',
            btn: '테스트 시작',
        },
        uk: {
            title: 'Ким би ви були в AdGuard?',
            btn: 'Дізнатися',
        },
        ar: {
            title: '؟AdGuard من كنت ستكون في ',
            btn: 'اكتشاف',
        },
        be: {
            title: 'Кім бы вы былі ў AdGuard?',
            btn: 'Даведацца',
        },
        id: {
            title: 'Siapa yang akan Anda jadi di AdGuard?',
            btn: 'Mengetahui',
        },
        pl: {
            title: 'Kim byłbyś w AdGuard?',
            btn: 'Dowiedzieć się',
        },
        tr: {
            title: "AdGuard'da kim olurdunuz?",
            btn: 'Öğrenmek',
        },
        vi: {
            title: 'Bạn sẽ là ai trong AdGuard?',
            btn: 'Tìm hiểu',
        },
        bg: {
            title: 'Кой бихте били в AdGuard?',
            btn: 'Разбера',
        },
        ca: {
            title: 'Qui seríeu a AdGuard?',
            btn: 'Esbrinar',
        },
        cs: {
            title: 'Kým byste byli v AdGuard?',
            btn: 'Zjistit',
        },
        da: {
            title: 'Hvem ville du være i AdGuard?',
            btn: 'Finde ud af',
        },
        el: {
            title: 'Ποιος θα ήσασταν στο AdGuard;',
            btn: 'Μάθω',
        },
        fa: {
            title: 'چه نقشی داشته‌اید؟ AdGuard شما در ',
            btn: 'فهمیدن',
        },
        fi: {
            title: 'Kuka olisit AdGuardissa?',
            btn: 'Selvittää',
        },
        he: {
            title: '?AdGuardמי היית ב',
            btn: 'לגלות',
        },
        hr: {
            title: 'Tko bi bio u AdGuardu?',
            btn: 'Saznati',
        },
        hu: {
            title: 'Ki lennél az AdGuardban?',
            btn: 'Megtudni',
        },
        hy: {
            title: 'Ով կլինեիք AdGuard-ում՞',
            btn: 'Պարզել',
        },
        lt: {
            title: 'Kuo būtumėte AdGuard?',
            btn: 'Sužinoti',
        },
        ms: {
            title: 'Siapa anda akan jadi di AdGuard?',
            btn: 'Ketahui',
        },
        no: {
            title: 'Hvem ville du vært i AdGuard?',
            btn: 'Finne ut',
        },
        nl: {
            title: 'Wie zou je zijn bij AdGuard?',
            btn: 'Uitvinden',
        },
        ro: {
            title: 'Cine ai fi în AdGuard?',
            btn: 'Afla',
        },
        sk: {
            title: 'Kým by ste boli v AdGuard?',
            btn: 'Zistiť',
        },
        sl: {
            title: 'Kdo bi bil v AdGuard?',
            btn: 'Izvedeti',
        },
        'sr-Latn': {
            title: 'Ko bi ste bili u AdGuard?',
            btn: 'Saznati',
        },
        sv: {
            title: 'Vem skulle du vara i AdGuard?',
            btn: 'Ta reda på',
        },
    },
    // will be selected for locale, see usage of getNotificationText
    text: null,
    urlQuery: COMMON_PROMO_URL_QUERY,
    from: '30 May 2024 12:00:00',
    to: '5 June 2024 23:59:00',
    type: 'animated',
    // TODO: use lazyGet() if promo should not be different for different locales,
    // otherwise it will not work on variable re-assignment
    bgImage: getUrl('assets/images/birthday24.svg'),
    icons: {
        ENABLED: {
            19: getUrl('assets/images/icons/birthday24-on-19.png'),
            38: getUrl('assets/images/icons/birthday24-on-38.png'),
        },
        DISABLED: {
            19: getUrl('assets/images/icons/birthday24-off-19.png'),
            38: getUrl('assets/images/icons/birthday24-off-38.png'),
        },
    },
};

const notifications: { [key: string]: PromoNotificationData } = {
    [BIRTHDAY_24_ID]: birthday24Notification,
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
