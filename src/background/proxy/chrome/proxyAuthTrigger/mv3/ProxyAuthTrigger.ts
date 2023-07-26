import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';

import { PAC_SCRIPT_CHECK_URL } from '../../../proxyConsts';
import { log } from '../../../../../lib/logger';

class ProxyAuthTrigger {
    /**
     * As onAuthRequired event doesn't fire if we send a random request to
     * PAC_SCRIPT_CHECK_URL from the service worker, like we did in the mv2 extension, we need to open a hidden window.
     * There is a known bug in Chrome: https://bugs.chromium.org/p/chromium/issues/detail?id=1464898
     * when onAuthRequired is not triggered when request is sent from service worker.
     * When this bug is fixed, this method can be removed.
     */
    async run() {
        const HIDDEN_WINDOW_LIFE_MS = 2000;
        try {
            // open hidden window to trigger onAuthRequired
            const hiddenWindow = await browser.windows.create({
                url: `http://${nanoid()}.${PAC_SCRIPT_CHECK_URL}`,
                focused: false,
                state: 'minimized',
            });
            await new Promise((resolve) => {
                setTimeout(resolve, HIDDEN_WINDOW_LIFE_MS);
            });
            await browser.windows.remove(hiddenWindow.id!);
        } catch (ex) {
            log.error(`Error while running proxy auth trigger: ${ex}`);
        }
    }
}

export { ProxyAuthTrigger };
