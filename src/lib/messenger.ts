import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';

import { MESSAGES_TYPES } from './constants';
import { log } from './logger';
import { ExclusionsModes, ExclusionsTypes } from '../common/exclusionsConstants';
import { ExclusionsDataToImport } from '../background/exclusions/Exclusions';

class Messenger {
    async sendMessage(type: string, data?: unknown) {
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

    /**
     * Used to receive notifications from background page
     * @param events Events for listening
     * @param callback Event listener callback
     */
    createEventListener = async (events: any, callback: (arg0: any) => void) => {
        const eventListener = (...args: { type: any; data: any; }[]) => {
            // @ts-ignore
            callback(...args);
        };

        let listenerId: string | null;
        const type = MESSAGES_TYPES.ADD_EVENT_LISTENER;
        listenerId = await this.sendMessage(type, { events });

        browser.runtime.onMessage.addListener((message) => {
            if (message.type === MESSAGES_TYPES.NOTIFY_LISTENERS) {
                const [type, data] = message.data;
                eventListener({ type, data });
            }
        });

        const onUnload = async () => {
            if (listenerId) {
                const type = MESSAGES_TYPES.REMOVE_EVENT_LISTENER;
                await this.sendMessage(type, { listenerId });
                listenerId = null;
            }
        };

        window.addEventListener('beforeunload', onUnload);
        window.addEventListener('unload', onUnload);

        return onUnload;
    };

    /**
     * Creates long lived connections between popup and background page
     * @param events
     * @param callback
     * @returns {function}
     */
    createLongLivedConnection = (events: any, callback: (arg0: any) => void) => {
        const eventListener = (...args: { type: any; data: any; }[]) => {
            // @ts-ignore
            callback(...args);
        };

        const port = browser.runtime.connect({ name: `popup_${nanoid()}` });
        port.postMessage({ type: MESSAGES_TYPES.ADD_LONG_LIVED_CONNECTION, data: { events } });

        port.onMessage.addListener((message) => {
            if (message.type === MESSAGES_TYPES.NOTIFY_LISTENERS) {
                const [type, data] = message.data;
                eventListener({ type, data });
            }
        });

        port.onDisconnect.addListener(() => {
            if (browser.runtime.lastError) {
                log.debug(browser.runtime.lastError.message);
            }
        });

        const onUnload = async () => {
            port.disconnect();
        };

        window.addEventListener('beforeunload', onUnload);
        window.addEventListener('unload', onUnload);

        return onUnload;
    };

    async getPopupData(url: string, numberOfTries: number) {
        const type = MESSAGES_TYPES.GET_POPUP_DATA;
        return this.sendMessage(type, { url, numberOfTries });
    }

    async getOptionsData() {
        const type = MESSAGES_TYPES.GET_OPTIONS_DATA;
        return this.sendMessage(type);
    }

    async getVpnFailurePage() {
        const type = MESSAGES_TYPES.GET_VPN_FAILURE_PAGE;
        return this.sendMessage(type);
    }

    async openOptionsPage() {
        const type = MESSAGES_TYPES.OPEN_OPTIONS_PAGE;
        return this.sendMessage(type);
    }

    async setCurrentLocation(location: any, isSelectedByUser: boolean) {
        const type = MESSAGES_TYPES.SET_SELECTED_LOCATION;
        return this.sendMessage(type, { location, isSelectedByUser });
    }

    async authenticateUser(
        credentials: {
            username: string;
            password: string;
            passwordAgain: string;
            twoFactor: string;
        },
    ) {
        const type = MESSAGES_TYPES.AUTHENTICATE_USER;
        return this.sendMessage(type, { credentials });
    }

    async deauthenticateUser() {
        const type = MESSAGES_TYPES.DEAUTHENTICATE_USER;
        return this.sendMessage(type);
    }

    async updateAuthCache(field: string, value: string) {
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

    async getCanControlProxy() {
        const type = MESSAGES_TYPES.GET_CAN_CONTROL_PROXY;
        return this.sendMessage(type);
    }

    async enableProxy(force: boolean) {
        const type = MESSAGES_TYPES.ENABLE_PROXY;
        return this.sendMessage(type, { force });
    }

    async disableProxy(force: boolean) {
        const type = MESSAGES_TYPES.DISABLE_PROXY;
        return this.sendMessage(type, { force });
    }

    async addUrlToExclusions(url: string) {
        const type = MESSAGES_TYPES.ADD_URL_TO_EXCLUSIONS;
        return this.sendMessage(type, { url });
    }

    async removeExclusion(id: string) {
        const type = MESSAGES_TYPES.REMOVE_EXCLUSION;
        return this.sendMessage(type, { id });
    }

    async toggleExclusionState(id: string) {
        const type = MESSAGES_TYPES.TOGGLE_EXCLUSION_STATE;
        return this.sendMessage(type, { id });
    }

    async addService(id: string) {
        const type = MESSAGES_TYPES.ADD_SERVICE;
        return this.sendMessage(type, { id });
    }

    async toggleServices(ids: string[]) {
        const type = MESSAGES_TYPES.TOGGLE_SERVICES;
        return this.sendMessage(type, { ids });
    }

    async removeFromExclusions(url: string) {
        const type = MESSAGES_TYPES.REMOVE_FROM_EXCLUSIONS;
        return this.sendMessage(type, { url });
    }

    async getIsExcluded(url: string) {
        const type = MESSAGES_TYPES.GET_IS_EXCLUDED;
        return this.sendMessage(type, { url });
    }

    async toggleSubdomainStateInExclusionsGroup(exclusionsGroupId: string, subdomainId: string) {
        const type = MESSAGES_TYPES.TOGGLE_SUBDOMAIN_STATE_IN_EXCLUSIONS_GROUP;
        return this.sendMessage(type, { exclusionsGroupId, subdomainId });
    }

    async removeSubdomainFromExclusionsGroup(exclusionsGroupId: string, subdomainId: string) {
        const type = MESSAGES_TYPES.REMOVE_SUBDOMAIN_FROM_EXCLUSIONS_GROUP;
        return this.sendMessage(type, { exclusionsGroupId, subdomainId });
    }

    async addSubdomainToExclusionsGroup(exclusionsGroupId: string, subdomain: string) {
        const type = MESSAGES_TYPES.ADD_SUBDOMAIN_TO_EXCLUSIONS_GROUP;
        return this.sendMessage(type, { exclusionsGroupId, subdomain });
    }

    async removeExclusionsGroupFromService(serviceId: string, exclusionsGroupId: string) {
        const type = MESSAGES_TYPES.REMOVE_EXCLUSIONS_GROUP_FROM_SERVICE;
        return this.sendMessage(type, { serviceId, exclusionsGroupId });
    }

    async toggleExclusionsGroupStateInService(serviceId: string, exclusionsGroupId: string) {
        const type = MESSAGES_TYPES.TOGGLE_EXCLUSIONS_GROUP_STATE_IN_SERVICE;
        return this.sendMessage(type, { serviceId, exclusionsGroupId });
    }

    async removeSubdomainFromExclusionsGroupInService(
        serviceId: string,
        exclusionsGroupId: string,
        subdomainId: string,
    ) {
        const type = MESSAGES_TYPES.REMOVE_SUBDOMAIN_FROM_EXCLUSIONS_GROUP_IN_SERVICE;
        return this.sendMessage(type, { serviceId, exclusionsGroupId, subdomainId });
    }

    async toggleSubdomainStateInExclusionsGroupInService(
        serviceId: string,
        exclusionsGroupId: string,
        subdomainId: string,
    ) {
        const type = MESSAGES_TYPES.TOGGLE_SUBDOMAIN_IN_EXCLUSIONS_GROUP_IN_SERVICE;
        return this.sendMessage(type, { serviceId, exclusionsGroupId, subdomainId });
    }

    async addSubdomainToExclusionsGroupInService(
        serviceId: string,
        exclusionsGroupId: string,
        subdomain: string,
    ) {
        const type = MESSAGES_TYPES.ADD_SUBDOMAIN_TO_EXCLUSIONS_GROUP_IN_SERVICE;
        return this.sendMessage(type, { serviceId, exclusionsGroupId, subdomain });
    }

    async resetServiceData(serviceId: string) {
        const type = MESSAGES_TYPES.RESET_SERVICE_DATA;
        return this.sendMessage(type, { serviceId });
    }

    async clearExclusionsList() {
        const type = MESSAGES_TYPES.CLEAR_EXCLUSIONS_LIST;
        return this.sendMessage(type);
    }

    async importExclusionsData(exclusionsData: ExclusionsDataToImport[]) {
        const type = MESSAGES_TYPES.IMPORT_EXCLUSIONS_DATA;
        return this.sendMessage(type, { exclusionsData });
    }

    async checkEmail(email: string) {
        const type = MESSAGES_TYPES.CHECK_EMAIL;
        return this.sendMessage(type, { email });
    }

    async disableOtherExtensions() {
        const type = MESSAGES_TYPES.DISABLE_OTHER_EXTENSIONS;
        return this.sendMessage(type);
    }

    async registerUser(credentials: {
        username: string;
        password: string;
        passwordAgain: string;
        twoFactor: string;
    }) {
        const type = MESSAGES_TYPES.REGISTER_USER;
        return this.sendMessage(type, { credentials });
    }

    async isAuthenticated() {
        const type = MESSAGES_TYPES.IS_AUTHENTICATED;
        return this.sendMessage(type);
    }

    async startSocialAuth(social: string, marketingConsent: boolean) {
        const type = MESSAGES_TYPES.START_SOCIAL_AUTH;
        return this.sendMessage(type, { social, marketingConsent });
    }

    async clearPermissionsError() {
        const type = MESSAGES_TYPES.CLEAR_PERMISSIONS_ERROR;
        return this.sendMessage(type);
    }

    async checkPermissions() {
        const type = MESSAGES_TYPES.CHECK_PERMISSIONS;
        return this.sendMessage(type);
    }

    async getExclusionsInverted() {
        const type = MESSAGES_TYPES.GET_EXCLUSIONS_INVERTED;
        return this.sendMessage(type);
    }

    async getSetting(settingId: string) {
        const type = MESSAGES_TYPES.GET_SETTING_VALUE;
        return this.sendMessage(type, { settingId });
    }

    async setSetting(settingId: string, value: any) {
        const type = MESSAGES_TYPES.SET_SETTING_VALUE;
        return this.sendMessage(type, { settingId, value });
    }

    async getUsername() {
        const type = MESSAGES_TYPES.GET_USERNAME;
        return this.sendMessage(type);
    }

    async getExclusionsData() {
        const type = MESSAGES_TYPES.GET_EXCLUSIONS_DATA;
        return this.sendMessage(type);
    }

    async setExclusionsMode(mode: ExclusionsModes) {
        const type = MESSAGES_TYPES.SET_EXCLUSIONS_MODE;
        return this.sendMessage(type, { mode });
    }

    async removeExclusionByMode(mode: ExclusionsModes, id: string) {
        const type = MESSAGES_TYPES.REMOVE_EXCLUSION_BY_MODE;
        return this.sendMessage(type, { mode, id });
    }

    async getSelectedLocation() {
        const type = MESSAGES_TYPES.GET_SELECTED_LOCATION;
        return this.sendMessage(type);
    }

    async checkIsPremiumToken() {
        const type = MESSAGES_TYPES.CHECK_IS_PREMIUM_TOKEN;
        return this.sendMessage(type);
    }

    async setNotificationViewed(withDelay: boolean) {
        const type = MESSAGES_TYPES.SET_NOTIFICATION_VIEWED;
        return this.sendMessage(type, { withDelay });
    }

    async openTab(url: string) {
        const type = MESSAGES_TYPES.OPEN_TAB;
        return this.sendMessage(type, { url });
    }

    async reportBug(email: string, message: string, includeLog: boolean) {
        const type = MESSAGES_TYPES.REPORT_BUG;
        return this.sendMessage(type, { email, message, includeLog });
    }

    async setDesktopVpnEnabled(status: boolean) {
        const type = MESSAGES_TYPES.SET_DESKTOP_VPN_ENABLED;
        return this.sendMessage(type, { status });
    }

    async openPremiumPromoPage() {
        const type = MESSAGES_TYPES.OPEN_PREMIUM_PROMO_PAGE;
        return this.sendMessage(type);
    }

    /**
     * Sets value for key in flags storage
     * @param key
     * @param value
     */
    async setFlag(key: string, value: string) {
        const type = MESSAGES_TYPES.SET_FLAG;
        return this.sendMessage(type, { key, value });
    }
}

export default new Messenger();
