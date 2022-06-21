import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';
import { translator } from '../common/translator';

const BLANK_IMAGE_PATH = '../assets/images/blank.svg';

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
            title: options.title || translator.getMessage('short_name'),
            message: options.message,
        };
        await browser.notifications.create(nanoid(), notificationOptions);
    };
}

export const notifications = new Notifications();
