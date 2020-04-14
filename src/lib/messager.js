import browser from 'webextension-polyfill';
import { MESSAGES_TYPES } from './constants';

class Messager {
    sendMessage(type, data) {
        return browser.runtime.sendMessage({ type, data });
    }

    async getPopupData(url, numberOfTries) {
        const type = MESSAGES_TYPES.GET_POPUP_DATA;
        return this.sendMessage(type, { url, numberOfTries });
    }
}

export default new Messager();
