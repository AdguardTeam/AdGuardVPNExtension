import browser from 'webextension-polyfill';
import nanoid from 'nanoid';

class Notifications {
    create = async (options) => {
        const notificationOptions = {
            type: 'basic',
            iconUrl: 'assets/images/icon-128.png',
            title: 'AdGuard VPN',
            message: options.message,
        };
        await browser.notifications.create(nanoid(), notificationOptions);
    }
}

const notifications = new Notifications();
export default notifications;
