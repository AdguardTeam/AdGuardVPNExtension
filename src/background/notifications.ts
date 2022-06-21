import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';
import { translator } from '../common/translator';

const BLANK_IMAGE_PATH = '../assets/images/blank.svg';
const DEFAULT_TITLE = translator.getMessage('short_name');

interface NotificationsInterface {
    create(options: { message: string }): Promise<void>;
}

class Notifications implements NotificationsInterface {
    /**
     * Creates notification with provided message
     * @param options
     */
    create = async (options: { title?: string, message: string }): Promise<void> => {
        const notificationOptions: browser.Notifications.CreateNotificationOptions = {
            type: 'basic',
            iconUrl: BLANK_IMAGE_PATH,
            title: options.title || DEFAULT_TITLE,
            message: options.message,
        };
        await browser.notifications.create(nanoid(), notificationOptions);
    };
}

export const notifications = new Notifications();
