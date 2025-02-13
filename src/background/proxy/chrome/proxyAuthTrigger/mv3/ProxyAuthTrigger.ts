import { nanoid } from 'nanoid';

import { PAC_SCRIPT_CHECK_URL } from '../../../proxyConsts';
import { log } from '../../../../../common/logger';

const createOffScreenDocument = (() => {
    let creating: Promise<void> | null; // A global promise to avoid concurrency issues

    return async () => {
        if (creating) {
            await creating;
        } else {
            creating = chrome.offscreen.createDocument({
                url: 'offscreen.html',
                reasons: [
                    chrome.offscreen.Reason.WORKERS
                    // Fallback reason because Reason.WORKERS is not supported prior to Chrome 113
                    || chrome.offscreen.Reason.IFRAME_SCRIPTING,
                ],
                justification: 'needed to trigger on auth required handler',
            });
            await creating;
            creating = null;
        }
    };
})();

class ProxyAuthTrigger {
    /**
     * As onAuthRequired event doesn't fire if we send a random request to
     * PAC_SCRIPT_CHECK_URL from the service worker, like we did in the mv2 extension, we decided to use an ugly hack
     * for triggering onAuthRequired.
     * To send a random request, we use worker created from the offscreen document.
     * background service worker -> offscreen document -> worker
     *
     * There are known bugs in Chrome:
     * https://bugs.chromium.org/p/chromium/issues/detail?id=1464898
     * https://bugs.chromium.org/p/chromium/issues/detail?id=1392461
     * when onAuthRequired is not triggered when request is sent from service worker.
     * When this bug is fixed, this method can be removed.
     */
    async run() {
        try {
            await createOffScreenDocument();
        } catch (e) {
            // if the offscreen document is already created, we just print error in the console
            log.info(e);
        }

        // eslint-disable-next-line no-restricted-globals
        const serviceWorkerSelf = self as unknown as ServiceWorkerGlobalScope;

        // after the offscreen document is created, send a message to it
        const clientsList = await serviceWorkerSelf.clients.matchAll();
        const client = clientsList.find((c) => c.url.endsWith('offscreen.html'));
        if (client) {
            client.postMessage(`http://${nanoid()}.${PAC_SCRIPT_CHECK_URL}`);
        } else {
            throw new Error('offscreen document is not found');
        }
    }
}

export { ProxyAuthTrigger };
