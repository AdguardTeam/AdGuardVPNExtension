import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';

import { MessageType } from './constants';
import { log } from './logger';
import { ExclusionsData, ExclusionsModes, ServiceDto } from '../common/exclusionsConstants';

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
    createEventListener = async (events: any, callback: (...args: any[]) => void) => {
        const eventListener = (...args: any[]) => {
            callback(...args);
        };

        let listenerId: string | null;
        const type = MessageType.ADD_EVENT_LISTENER;
        listenerId = await this.sendMessage(type, { events });

        browser.runtime.onMessage.addListener((message) => {
            if (message.type === MessageType.NOTIFY_LISTENERS) {
                const [type, data] = message.data;
                eventListener({ type, data });
            }
        });

        const onUnload = async () => {
            if (listenerId) {
                const type = MessageType.REMOVE_EVENT_LISTENER;
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
    createLongLivedConnection = (events: any, callback: (...args: any[]) => void) => {
        const eventListener = (...args: { type: any; data: any; }[]) => {
            callback(...args);
        };

        const port = browser.runtime.connect({ name: `popup_${nanoid()}` });
        port.postMessage({ type: MessageType.ADD_LONG_LIVED_CONNECTION, data: { events } });

        port.onMessage.addListener((message) => {
            if (message.type === MessageType.NOTIFY_LISTENERS) {
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
        const type = MessageType.GET_POPUP_DATA;
        return this.sendMessage(type, { url, numberOfTries });
    }

    async getOptionsData() {
        const type = MessageType.GET_OPTIONS_DATA;
        return this.sendMessage(type);
    }

    async getVpnFailurePage() {
        const type = MessageType.GET_VPN_FAILURE_PAGE;
        return this.sendMessage(type);
    }

    async openOptionsPage() {
        const type = MessageType.OPEN_OPTIONS_PAGE;
        return this.sendMessage(type);
    }

    async openReferralOptions() {
        const type = MessageType.OPEN_REFERRAL_OPTIONS;
        return this.sendMessage(type);
    }

    async getReferralData() {
        const type = MessageType.GET_REFERRAL_DATA;
        return this.sendMessage(type);
    }

    async setCurrentLocation(location: any, isSelectedByUser: boolean) {
        const type = MessageType.SET_SELECTED_LOCATION;
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
        const type = MessageType.AUTHENTICATE_USER;
        return this.sendMessage(type, { credentials });
    }

    async deauthenticateUser() {
        const type = MessageType.DEAUTHENTICATE_USER;
        return this.sendMessage(type);
    }

    async updateAuthCache(field: string, value: string) {
        const type = MessageType.UPDATE_AUTH_CACHE;
        return this.sendMessage(type, { field, value });
    }

    async getAuthCache() {
        const type = MessageType.GET_AUTH_CACHE;
        return this.sendMessage(type);
    }

    async clearAuthCache() {
        const type = MessageType.CLEAR_AUTH_CACHE;
        return this.sendMessage(type);
    }

    async getCanControlProxy() {
        const type = MessageType.GET_CAN_CONTROL_PROXY;
        return this.sendMessage(type);
    }

    async enableProxy(force: boolean) {
        const type = MessageType.ENABLE_PROXY;
        return this.sendMessage(type, { force });
    }

    async disableProxy(force: boolean) {
        const type = MessageType.DISABLE_PROXY;
        return this.sendMessage(type, { force });
    }

    async addUrlToExclusions(url: string) {
        const type = MessageType.ADD_URL_TO_EXCLUSIONS;
        return this.sendMessage(type, { url });
    }

    async removeExclusion(id: string) {
        const type = MessageType.REMOVE_EXCLUSION;
        return this.sendMessage(type, { id });
    }

    async disableVpnByUrl(url: string) {
        const type = MessageType.DISABLE_VPN_BY_URL;
        return this.sendMessage(type, { url });
    }

    async enableVpnByUrl(url: string) {
        const type = MessageType.ENABLE_VPN_BY_URL;
        return this.sendMessage(type, { url });
    }

    async toggleExclusionState(id: string) {
        const type = MessageType.TOGGLE_EXCLUSION_STATE;
        return this.sendMessage(type, { id });
    }

    async restoreExclusions() {
        const type = MessageType.RESTORE_EXCLUSIONS;
        return this.sendMessage(type);
    }

    async toggleServices(ids: string[]) {
        const type = MessageType.TOGGLE_SERVICES;
        return this.sendMessage(type, { ids });
    }

    async resetServiceData(serviceId: string) {
        const type = MessageType.RESET_SERVICE_DATA;
        return this.sendMessage(type, { serviceId });
    }

    async clearExclusionsList() {
        const type = MessageType.CLEAR_EXCLUSIONS_LIST;
        return this.sendMessage(type);
    }

    async checkEmail(email: string) {
        const type = MessageType.CHECK_EMAIL;
        return this.sendMessage(type, { email });
    }

    async disableOtherExtensions() {
        const type = MessageType.DISABLE_OTHER_EXTENSIONS;
        return this.sendMessage(type);
    }

    async registerUser(credentials: {
        username: string;
        password: string;
        passwordAgain: string;
        twoFactor: string;
    }) {
        const type = MessageType.REGISTER_USER;
        return this.sendMessage(type, { credentials });
    }

    async isAuthenticated() {
        const type = MessageType.IS_AUTHENTICATED;
        return this.sendMessage(type);
    }

    async startSocialAuth(social: string, marketingConsent: boolean) {
        const type = MessageType.START_SOCIAL_AUTH;
        return this.sendMessage(type, { social, marketingConsent });
    }

    async clearPermissionsError() {
        const type = MessageType.CLEAR_PERMISSIONS_ERROR;
        return this.sendMessage(type);
    }

    async checkPermissions() {
        const type = MessageType.CHECK_PERMISSIONS;
        return this.sendMessage(type);
    }

    async getExclusionsInverted() {
        const type = MessageType.GET_EXCLUSIONS_INVERTED;
        return this.sendMessage(type);
    }

    async getSetting(settingId: string) {
        const type = MessageType.GET_SETTING_VALUE;
        return this.sendMessage(type, { settingId });
    }

    async setSetting(settingId: string, value: any) {
        const type = MessageType.SET_SETTING_VALUE;
        return this.sendMessage(type, { settingId, value });
    }

    async getUsername() {
        const type = MessageType.GET_USERNAME;
        return this.sendMessage(type);
    }

    async exportLogs() {
        const type = MessageType.EXPORT_LOGS;
        return this.sendMessage(type);
    }

    async getExclusionsData(): Promise<{
        exclusionsData: ExclusionsData,
        services: ServiceDto[],
        isAllExclusionsListsEmpty: boolean,
    }> {
        const type = MessageType.GET_EXCLUSIONS_DATA;
        return this.sendMessage(type);
    }

    async setExclusionsMode(mode: ExclusionsModes) {
        const type = MessageType.SET_EXCLUSIONS_MODE;
        return this.sendMessage(type, { mode });
    }

    async getSelectedLocation() {
        const type = MessageType.GET_SELECTED_LOCATION;
        return this.sendMessage(type);
    }

    async checkIsPremiumToken() {
        const type = MessageType.CHECK_IS_PREMIUM_TOKEN;
        return this.sendMessage(type);
    }

    async setNotificationViewed(withDelay: boolean) {
        const type = MessageType.SET_NOTIFICATION_VIEWED;
        return this.sendMessage(type, { withDelay });
    }

    async openTab(url: string) {
        const type = MessageType.OPEN_TAB;
        return this.sendMessage(type, { url });
    }

    async reportBug(email: string, message: string, includeLog: boolean) {
        const type = MessageType.REPORT_BUG;
        return this.sendMessage(type, { email, message, includeLog });
    }

    async setDesktopVpnEnabled(status: boolean) {
        const type = MessageType.SET_DESKTOP_VPN_ENABLED;
        return this.sendMessage(type, { status });
    }

    async openPremiumPromoPage() {
        const type = MessageType.OPEN_PREMIUM_PROMO_PAGE;
        return this.sendMessage(type);
    }

    /**
     * Sets value for key in flags storage
     * @param key
     * @param value
     */
    async setFlag(key: string, value: string) {
        const type = MessageType.SET_FLAG;
        return this.sendMessage(type, { key, value });
    }

    getGeneralExclusions() {
        const type = MessageType.GET_GENERAL_EXCLUSIONS;
        return this.sendMessage(type);
    }

    getSelectiveExclusions() {
        const type = MessageType.GET_SELECTIVE_EXCLUSIONS;
        return this.sendMessage(type);
    }

    addRegularExclusions(exclusions: string[]) {
        const type = MessageType.ADD_REGULAR_EXCLUSIONS;
        return this.sendMessage(type, { exclusions });
    }

    addSelectiveExclusions(exclusions: string[]) {
        const type = MessageType.ADD_SELECTIVE_EXCLUSIONS;
        return this.sendMessage(type, { exclusions });
    }

    addExclusionsMap(exclusionsMap: {
        [ExclusionsModes.Regular]: string[],
        [ExclusionsModes.Selective]: string[],
    }) {
        const type = MessageType.ADD_EXCLUSIONS_MAP;
        return this.sendMessage(type, { exclusionsMap });
    }
}

export const messenger = new Messenger();
