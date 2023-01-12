import browser from 'webextension-polyfill';

import { log } from '../../lib/logger';

class Management {
    PROXY_PERMISSION = 'proxy';

    private browser: browser.Browser;

    constructor(browser: browser.Browser) {
        this.browser = browser;
    }

    /**
     * Gets list of proxy extension and turns them off
     */
    turnOffProxyExtensions = async (): Promise<void> => {
        const enabledProxyExtensions = await this.getEnabledProxyExtensions();

        const promises = enabledProxyExtensions.map(async (extension) => {
            try {
                await this.browser.management.setEnabled(extension.id, false);
            } catch (e) {
                log.error(e);
            }
        });

        await Promise.all(promises);
    };

    /**
     * Returns list of enabled extensions with proxy permission, except extension itself
     */
    getEnabledProxyExtensions = async () => {
        const extensions = await this.browser.management.getAll();
        return extensions.filter((extension) => {
            const { permissions, enabled, id } = extension;
            return permissions?.includes(this.PROXY_PERMISSION)
                && id !== this.browser.runtime.id
                && enabled;
        });
    };
}

export default Management;
