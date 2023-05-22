/**
 * This module manages promo notifications
 */
import browser from 'webextension-polyfill';

import { lazyGet } from '../lib/helpers';
import { getUrl } from './browserApi/runtime';
import { browserApi } from './browserApi';
import { Prefs } from './prefs';
import { notifier } from '../lib/notifier';
import { FORWARDER_DOMAIN } from './config';
import { timers } from './timers';

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

const normalizeLanguage = (locale: string): string | null => {
    if (!locale) {
        return null;
    }

    return locale.toLowerCase().replace('-', '_');
};

const promoLink = `https://${FORWARDER_DOMAIN}/forward.html?action=birthday_14_promo_vpn&from=popup&app=vpn_extension`;

const birthday14Notification = {
    id: 'birthday14Promo',
    locales: {
        en: {
            title: 'What does AI say?',
            btn: 'Guess',
        },
        ru: {
            title: 'Пойми ИИ',
            btn: 'Играть',
        },
        ko: {
            title: '인공지능은 뭐라고 말하나요?',
            btn: '게임 시작',
        },
        es: {
            title: 'Quiz: piensa como una IA',
            btn: 'Comenzar',
        },
        de: {
            title: 'Was sagt KI?',
            btn: 'Spielen',
        },
        pt_pt: {
            title: 'Quiz: pensa como uma IA',
            btn: 'Começar',
        },
        pt_br: {
            title: 'Quiz: pense como uma IA',
            btn: 'Começar',
        },
        zh_tw: {
            title: '成為一個“更懂” AI 的人',
            btn: '進行遊戲！',
        },
        zh_cn: {
            title: '成为一个“更懂” AI 的人',
            btn: '玩儿游戏！',
        },
        ja: {
            title: 'AI（人工知能）を 理解してみよう',
            btn: '玩儿游戏！',
        },
        fr: {
            title: 'L\'IA dit quoi?',
            btn: 'Devinez!',
        },
        it: {
            title: 'Cosa dice l\'IA?',
            btn: 'Indovinarlo',
        },
        uk: {
            title: 'Що говорить штучний інтелект?',
            btn: 'Грати',
        },
        ar: {
            title: 'ماذا يقول الذكاء الاصطناعي؟',
            btn: 'لعب',
        },
        be: {
            title: 'Што кажа штучны інтэлект?',
            btn: 'Гуляць',
        },
        bg: {
            title: 'Какво казва ИИ?',
            btn: 'Играя',
        },
        ca: {
            title: 'Què diu la IA?',
            btn: 'Jugar',
        },
        cs: {
            title: 'Co říká umělá inteligence?',
            btn: 'Přehrát',
        },
        da: {
            title: 'Hvad siger den kunstige intelligens?',
            btn: 'Spil',
        },
        el: {
            title: 'Τι λέει η Τεχνητή Νοημοσύνη;',
            btn: 'Παίζω',
        },
        es_419: {
            title: 'Quiz: piensa como una IA',
            btn: 'Comenzar',
        },
        fa: {
            title: 'هوش مصنوعی چه می گوید؟',
            btn: 'بازی',
        },
        fi: {
            title: 'Mitä tekoäly sanoo?',
            btn: 'Leikkiä',
        },
        he: {
            title: '?מה אומרת בינה מלאכותית',
            btn: 'משחק',
        },
        hr: {
            title: 'Što kaže umjetna inteligencija?',
            btn: 'Igrati',
        },
        hu: {
            title: 'Mit mond az MI?',
            btn: 'Játszik',
        },
        hy: {
            title: 'Ի՞նչ է ասում ԱԻ-ն:',
            btn: 'Խաղալ',
        },
        id: {
            title: 'Apa yang dikatakan AI?',
            btn: 'Bermain',
        },
        lt: {
            title: 'Ką sako dirbtinis intelektas?',
            btn: 'Žaisti',
        },
        ms: {
            title: 'Apa kata Kecerdasan Buatan?',
            btn: 'Bermain',
        },
        nb: {
            title: 'Hva sier kunstig intelligens?',
            btn: 'Skuespill',
        },
        nl: {
            title: 'Wat zegt KI?',
            btn: 'Spelen',
        },
        pl: {
            title: 'Co mówi sztuczna inteligencja?',
            btn: 'Grać',
        },
        ro: {
            title: 'Ce spune inteligența artificială?',
            btn: 'Juca',
        },
        sk: {
            title: 'Čo hovorí umelá inteligencia?',
            btn: 'Hrať',
        },
        sl: {
            title: 'Kaj pravi umetna inteligenca?',
            btn: 'Igrati',
        },
        sr: {
            title: 'Šta kaže veštačka inteligencija?',
            btn: 'Igra',
        },
        sv: {
            title: 'Vad säger artificiell intelligens?',
            btn: 'Leka',
        },
        tr: {
            title: 'Yapay zeka ne diyor?',
            btn: 'Oyun',
        },
        vi: {
            title: 'AI nói gì?',
            btn: 'Chơi',
        },
    },
    // will be selected for locale, see usage of getNotificationText
    text: null,
    url: promoLink,
    from: '01 June 2023 12:00:00',
    to: '07 June 2023 23:59:00',
    type: 'animated',
    get icons() {
        return lazyGet(birthday14Notification, 'icons', () => ({
            ENABLED: {
                19: getUrl('assets/images/icons/birthday14-on-19.png'),
                38: getUrl('assets/images/icons/birthday14-on-38.png'),
            },
            DISABLED: {
                19: getUrl('assets/images/icons/birthday14-off-19.png'),
                38: getUrl('assets/images/icons/birthday14-off-38.png'),
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
    birthday14Promo: birthday14Notification,
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
        timers.clearTimeout(timeoutId);
        timeoutId = timers.setTimeout(() => {
            setNotificationViewed(false);
        }, NOTIFICATION_DELAY);
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
