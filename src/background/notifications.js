import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';

const BLANK_IMAGE_PATH = '../assets/images/blank.svg';

class Notifications {
    create = async (options) => {
        const notificationOptions = {
            type: 'basic',
            iconUrl: BLANK_IMAGE_PATH,
            title: 'AdGuard VPN',
            message: options.message,
        };
        await browser.notifications.create(nanoid(), notificationOptions);
    };
}

const notifications = new Notifications();
export default notifications;
