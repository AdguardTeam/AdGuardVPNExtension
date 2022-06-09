import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';
import { translator } from '../common/translator';

const BLANK_IMAGE_PATH = '../assets/images/blank.svg';

class Notifications {
    create = async (options) => {
        const notificationOptions = {
            type: 'basic',
            iconUrl: BLANK_IMAGE_PATH,
            title: translator.getMessage('short_name'),
            message: options.message,
        };
        await browser.notifications.create(nanoid(), notificationOptions);
    };
}

export const notifications = new Notifications();
