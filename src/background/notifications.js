import browser from 'webextension-polyfill';
import nanoid from 'nanoid';
import { Prefs } from './prefs';

class Notifications {
    create = async (options) => {
        const notificationOptions = {
            type: 'basic',
            iconUrl: Prefs.ICONS.ENABLED['128'],
            title: 'AdGuard VPN',
            message: options.message,
        };
        await browser.notifications.create(nanoid(), notificationOptions);
    }
}

const notifications = new Notifications();
export default notifications;
