import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';

import { translator } from '../common/translator';
import { Prefs } from '../common/prefs';
import { getErrorMessage } from '../common/utils/error';
import { log } from '../lib/logger';

const DEFAULT_IMAGE_PATH = Prefs.ICONS.ENABLED['128'];
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
            iconUrl: DEFAULT_IMAGE_PATH,
            title: options.title || DEFAULT_TITLE,
            message: options.message,
        };

        try {
            await browser.notifications.create(nanoid(), notificationOptions);
        } catch (error) {
            log.error(getErrorMessage(error));
        }
    };
}

export const notifications = new Notifications();
