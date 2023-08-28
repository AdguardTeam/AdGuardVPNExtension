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

const VIEWED_NOTIFICATIONS = 'viewed-notifications';
const LAST_NOTIFICATION_TIME = 'viewed-notification-time';

const PROMO_LINK = `https://${FORWARDER_DOMAIN}/forward.html?action=back_to_school_23_vpn&from=popup&app=vpn_extension`;

const normalizeLanguage = (locale: string): string | null => {
    if (!locale) {
        return null;
    }

    return locale.toLowerCase().replace('-', '_');
};

const backToSchoolPromo23Notification = {
    id: 'backToSchool23',
    locales: {
        en: {
            title: 'Back to school: Quiz and prize',
            btn: 'Test yourself',
        },
        ru: {
            title: 'Снова в школу: квиз и приз',
            btn: 'Пройти',
        },
        es: {
            title: 'Vuelta al cole: quiz y recompensa',
            btn: 'Hacer el quiz',
        },
        de: {
            title: 'Back to School: Quiz und Preis',
            btn: 'Quiz los',
        },
        fr: {
            title: 'La rentrée avec AdGuard : Quiz et cadeaux',
            btn: 'Passez le Quiz',
        },
        it: {
            title: 'A Scuola con AdGuard: un quiz e un regalo',
            btn: 'Supera il Quiz',
        },
        ko: {
            title: '백 투 스쿨: 퀴즈 및 할인',
            btn: '퀴즈게임 시작',
        },
        ja: {
            title: 'Back to School セールとクイズ',
            btn: 'クイズに挑戦！',
        },
        zh_cn: {
            title: '开学特惠：小测验大惊喜',
            btn: '测试自己',
        },
        zh_tw: {
            title: '開學特惠：小測驗大驚喜',
            btn: '測試自己',
        },
        uk: {
            title: 'Знову до школи: іспит і приз',
            btn: 'Скласти',
        },
        pt_br: {
            title: 'Volta às aulas: quiz e prêmio',
            btn: 'Fazer o quiz',
        },
        pt_pt: {
            title: 'Volta às aulas: quiz e prémio',
            btn: 'Fazer o quiz',
        },
        ar: {
            title: 'العودة إلى المدرسة: مسابقة وجائزة',
            btn: 'حل الاختبار',
        },
        be: {
            title: 'Зноў у школу: віктарына і прызы',
            btn: 'Прайсці',
        },
        bg: {
            title: 'Отново в училище: тест и награда',
            btn: 'Преминете',
        },
        ca: {
            title: "Tornada a l'escola: qüestionari i premi",
            btn: 'Passar',
        },
        cs: {
            title: 'Zpátky do školy: kvíz a cena',
            btn: 'Projít',
        },
        da: {
            title: 'Tilbage til skolen: quiz og præmie',
            btn: 'Test deg selv',
        },
        el: {
            title: 'Επιστροφή στο σχολείο',
            btn: 'Περάστε',
        },
        es_419: {
            title: 'Vuelta al cole: quiz y recompensa',
            btn: 'Hacer el quiz',
        },
        fa: {
            title: 'بازگشت به مدرسه: مسابقه و جایزه',
            btn: 'امتحان را پاس کنید',
        },
        fi: {
            title: 'Takaisin kouluun: tietokilpailu ja palkinto',
            btn: 'Läpäise',
        },
        he: {
            title: 'חזרה לבית הספר: חידון ופרס',
            btn: 'לעבור',
        },
        hr: {
            title: 'Povratak u školu: kviz i nagrada',
            btn: 'Provjerite se',
        },
        hu: {
            title: 'Vissza az iskolába: egy kvíz és egy díj',
            btn: 'Teszteld magad',
        },
        hy: {
            title: 'Վերադառնալ դպրոց',
            btn: 'Ստուգեք ինքներդ',
        },
        id: {
            title: 'Kembali ke Sekolah: kuis dan Hadiah',
            btn: 'Uji dirimu',
        },
        lt: {
            title: 'Atgal į mokyklą: viktorina ir prizas',
            btn: 'Išbandyk save',
        },
        ms: {
            title: 'Kembali ke Sekolah: kuiz dan Hadiah',
            btn: 'Uji diri sendiri',
        },
        nb: {
            title: 'Tilbake til skolen: quiz og premie',
            btn: 'Test deg selv',
        },
        nl: {
            title: 'Terug naar school: quiz en prijs',
            btn: 'Test jezelf',
        },
        pl: {
            title: 'Powrót do szkoły: quiz i nagroda',
            btn: 'Sprawdź się',
        },
        ro: {
            title: 'Înapoi la școală: test și premiu',
            btn: 'Testați-vă',
        },
        sk: {
            title: 'Späť do školy: kvíz a cena',
            btn: 'Otestujte sa',
        },
        sl: {
            title: 'Nazaj v šolo: kviz in nagrada',
            btn: 'Preizkusite se',
        },
        'sr-Latn': {
            title: 'Povratak u školu: kviz i nagrada',
            btn: 'Proverite sami',
        },
        sv: {
            title: 'Tillbaka till skolan: quiz och pris',
            btn: 'Testa dig själv',
        },
        tr: {
            title: 'Okula Dönüş: Sınav ve Ödül',
            btn: 'Kendinizi test edin',
        },
        vi: {
            title: 'Back to School: câu đố và giải thưởng',
            btn: 'Tự kiểm tra',
        },
    },
    // will be selected for locale, see usage of getNotificationText
    text: null,
    url: PROMO_LINK,
    from: '28 August 2023 12:00:00',
    to: '3 September 2023 23:59:00',
    type: 'animated',
    get icons() {
        return lazyGet(backToSchoolPromo23Notification, 'icons', () => ({
            ENABLED: {
                19: getUrl('assets/images/icons/bts2023-on-19.png'),
                38: getUrl('assets/images/icons/bts2023-on-38.png'),
            },
            DISABLED: {
                19: getUrl('assets/images/icons/bts2023-off-19.png'),
                38: getUrl('assets/images/icons/bts2023-off-38.png'),
            },
        }));
    },
};

/**
 * @typedef Notification
 * @type object
 * @property {string} id
 * @property {object} locales
 * @property {string} url
 * @property {string} text
 * @property {string} from
 * @property {string} to
 * @property {string} bgColor;
 * @property {string} textColor;
 * @property {string} badgeBgColor;
 * @property {string} badgeText;
 * @property {string} type;
 */

const notifications: { [key: string]: PromoNotificationData } = {
    backToSchoolPromo23: backToSchoolPromo23Notification,
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
const checkTimeoutMs = 10 * 60 * 1000; // 10 minutes
const minPeriod = 30 * 60 * 1000; // 30 minutes
const NOTIFICATION_DELAY = 30 * 1000; // clear notification in 30 seconds
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
        }, NOTIFICATION_DELAY) as any; // TODO setup tsconfig to fix types
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
    if (Prefs.browser === 'Firefox') {
        return null;
    }

    const currentTime = new Date().getTime();

    const timeSinceLastNotification = currentTime - (await getLastNotificationTime());
    if (timeSinceLastNotification < minPeriod) {
        // Just a check to not show the notification too often
        return null;
    }

    // Check not often than once in 10 minutes
    const timeSinceLastCheck = currentTime - notificationCheckTime;
    if (notificationCheckTime > 0 && timeSinceLastCheck <= checkTimeoutMs) {
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
