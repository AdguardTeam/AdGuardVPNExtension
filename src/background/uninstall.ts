import browser from 'webextension-polyfill';

import { log } from '../lib/logger';
import { UNINSTALL_PAGE_URL } from './config';

(async () => {
    try {
        // Set uninstall page url
        await browser.runtime.setUninstallURL(UNINSTALL_PAGE_URL);
        log.info(`Uninstall url was set to: ${UNINSTALL_PAGE_URL}`);
    } catch (e: any) {
        log.error(e.message);
    }
})();
