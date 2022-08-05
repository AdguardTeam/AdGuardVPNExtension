import browser from 'webextension-polyfill';
import { MessageType } from '../lib/constants';
import { messenger } from '../lib/messenger';

(async () => {
    const isAuthenticated = await messenger.isAuthenticated();
    if (isAuthenticated) {
        return;
    }

    await browser.runtime.sendMessage({
        type: MessageType.AUTHENTICATE_SOCIAL,
        data: { queryString: window.location.href.split('#')[1] },
    });
})();
