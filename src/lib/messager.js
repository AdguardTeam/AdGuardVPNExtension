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

    async getVpnFailurePage() {
        const type = MESSAGES_TYPES.GET_VPN_FAILURE_PAGE;
        return this.sendMessage(type);
    }

    async openOptionsPage() {
        const type = MESSAGES_TYPES.OPEN_OPTIONS_PAGE;
        return this.sendMessage(type);
    }

    async setCurrentEndpoint(endpoint) {
        const type = MESSAGES_TYPES.SET_CURRENT_ENDPOINT;
        return this.sendMessage(type, { endpoint });
    }
}

export default new Messager();
