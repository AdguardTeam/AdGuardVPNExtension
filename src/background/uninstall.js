import browser from 'webextension-polyfill';

import { log } from '../lib/logger';
import { UNINSTALL_URL } from '../lib/constants';

(async () => {
    try {
        // Set uninstall page url
        await browser.runtime.setUninstallURL(UNINSTALL_URL);
        log.info(`Uninstall url was set to: ${UNINSTALL_URL}`);
    } catch (e) {
        log.error(e.message);
    }
})();
