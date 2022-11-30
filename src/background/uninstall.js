/* global chrome */

import { log } from '../lib/logger';
import { UNINSTALL_PAGE_URL } from './config';

(async () => {
    try {
        // Set uninstall page url
        await chrome.runtime.setUninstallURL(UNINSTALL_PAGE_URL);
        log.info(`Uninstall url was set to: ${UNINSTALL_PAGE_URL}`);
    } catch (e) {
        log.error(e.message);
    }
})();
