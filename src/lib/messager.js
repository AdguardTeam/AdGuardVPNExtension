import browser from 'webextension-polyfill';
import { MESSAGES_TYPES } from './constants';
import log from './logger';

class Messager {
    async sendMessage(type, data) {
        log.debug(`Request type: "${type}"`);
        if (data) {
            log.debug('Request data:', data);
        }

        const response = await browser.runtime.sendMessage({ type, data });

        if (response) {
            log.debug(`Response type: "${type}"`);
            log.debug('Response data:', response);
        }

        return response;
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

    async getAppId() {
        const type = MESSAGES_TYPES.GET_APP_ID;
        return this.sendMessage(type);
    }

    async authenticateUser(credentials) {
        const type = MESSAGES_TYPES.AUTHENTICATE_USER;
        return this.sendMessage(type, { credentials });
    }

    async deauthenticateUser() {
        const type = MESSAGES_TYPES.DEAUTHENTICATE_USER;
        return this.sendMessage(type);
    }

    async updateAuthCache(field, value) {
        const type = MESSAGES_TYPES.UPDATE_AUTH_CACHE;
        return this.sendMessage(type, { field, value });
    }

    async getAuthCache() {
        const type = MESSAGES_TYPES.GET_AUTH_CACHE;
        return this.sendMessage(type);
    }

    async clearAuthCache() {
        const type = MESSAGES_TYPES.CLEAR_AUTH_CACHE;
        return this.sendMessage(type);
    }

    async getCurrentEndpointPing() {
        const type = MESSAGES_TYPES.GET_CURRENT_ENDPOINT_PING;
        return this.sendMessage(type);
    }

    async getCanControlProxy() {
        const type = MESSAGES_TYPES.GET_CAN_CONTROL_PROXY;
        return this.sendMessage(type);
    }

    async enableProxy(force, withCancel) {
        const type = MESSAGES_TYPES.ENABLE_PROXY;
        return this.sendMessage(type, { force, withCancel });
    }

    async disableProxy(force, withCancel) {
        const type = MESSAGES_TYPES.DISABLE_PROXY;
        return this.sendMessage(type, { force, withCancel });
    }

    async addToExclusions(url, enabled, options) {
        const type = MESSAGES_TYPES.ADD_TO_EXCLUSIONS;
        return this.sendMessage(type, { url, enabled, options });
    }

    async removeFromExclusions(url) {
        const type = MESSAGES_TYPES.REMOVE_FROM_EXCLUSIONS;
        return this.sendMessage(type, { url });
    }
}

export default new Messager();
