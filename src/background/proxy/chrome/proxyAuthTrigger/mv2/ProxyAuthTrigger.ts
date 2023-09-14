import { nanoid } from 'nanoid';

import { PAC_SCRIPT_CHECK_URL } from '../../../proxyConsts';

class ProxyAuthTrigger {
    /**
     * As onAuthRequired event is not working reliably, this method sends a random request to
     * PAC_SCRIPT_CHECK_URL, which should be intercepted by proxy endpoint and return empty
     * response with status 200.
     * For example, there is a known bug in Chrome: https://bugs.chromium.org/p/chromium/issues/detail?id=1009243
     * when onAuthRequired is not triggered when request is sent from service worker.
     * When this bug is fixed, this method can be removed.
     */
    async run() {
        try {
            // After setting proxy, we need to send a random request. Otherwise, PAC-script can be cached
            await fetch(`http://${nanoid()}.${PAC_SCRIPT_CHECK_URL}`, { cache: 'no-cache' });
        } catch (e) {
            // ignore
        }
    }
}

export { ProxyAuthTrigger };
