import browser from 'webextension-polyfill';
import { MessageType } from '../lib/constants';

browser.runtime.sendMessage({
    type: MessageType.AUTHENTICATE_SOCIAL,
    data: { queryString: window.location.href.split('#')[1] },
});
