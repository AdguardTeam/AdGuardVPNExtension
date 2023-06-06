import browser from 'webextension-polyfill';
import { nanoid } from 'nanoid';

import { MessageType, SocialAuthProvider, ExclusionsContentMap } from './constants';
import { log } from './logger';
import { ExclusionsData, ExclusionsMode, ServiceDto } from '../common/exclusionsConstants';
import { StartSocialAuthData, UserLookupData } from '../background/messaging/messagingTypes';
import type { DnsServerData } from '../background/schema';
import type { LocationData } from '../popup/stores/VpnStore';
import type { Message } from '../popup/components/App/App';
import { NotifierType } from './notifier';
import { browserApi } from './browserApi';

class Messenger {
    async sendMessage<T>(type: string, data?: T) {
        log.debug(`Request type: "${type}"`);
        if (data) {
            log.debug('Request data:', data);
        }

        const response = await browserApi.runtime.sendMessage({ type, data });

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
    createEventListener = async (events: NotifierType[], callback: (...args: Message[]) => void) => {
        const eventListener = (...args: Message[]) => {
            callback(...args);
        };

        let listenerId = await this.sendMessage(MessageType.ADD_EVENT_LISTENER, { events });

        const messageHandler = (message: any) => {
            if (message.type === MessageType.NOTIFY_LISTENERS) {
                const [type, data] = message.data;
                eventListener({ type, data });
            }
        };

        const onUnload = async () => {
            if (listenerId) {
                browserApi.runtime.onMessage.removeListener(messageHandler);
                window.removeEventListener('beforeunload', onUnload);
                window.removeEventListener('unload', onUnload);

                await this.sendMessage(MessageType.REMOVE_EVENT_LISTENER, { listenerId });
                listenerId = null;
            }
        };

        browserApi.runtime.onMessage.addListener(messageHandler);
        window.addEventListener('beforeunload', onUnload);
        window.addEventListener('unload', onUnload);

        return onUnload;
    };

    /**
     * Creates long lived connections between popup and background page
     * @param events
     * @param callback
     */
    createLongLivedConnection = (events: NotifierType[], callback: (...args: Message[]) => void): Function => {
        const eventListener = (...args: { type: NotifierType; data: string; }[]) => {
            callback(...args);
        };

        const port = browserApi.runtime.connect({ name: `popup_${nanoid()}` });
        port.postMessage({ type: MessageType.ADD_LONG_LIVED_CONNECTION, data: { events } });

        port.onMessage.addListener((message) => {
            if (message.type === MessageType.NOTIFY_LISTENERS) {
                const [type, data] = message.data;
                eventListener({ type, data });
            }
        });

        port.onDisconnect.addListener(() => {
            if (browserApi.runtime.lastError) {
                log.debug(browserApi.runtime.lastError.message);
            }
        });

        const onUnload = async () => {
            port.disconnect();
        };

        window.addEventListener('beforeunload', onUnload);
        window.addEventListener('unload', onUnload);

        return onUnload;
    };

    async getPopupData(url: string | null, numberOfTries: number) {
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

    async openFreeGbsPage() {
        const type = MessageType.OPEN_FREE_GBS_PAGE;
        return this.sendMessage(type);
    }

    async getBonusesData() {
        const type = MessageType.GET_BONUSES_DATA;
        return this.sendMessage(type);
    }

    async setCurrentLocation(location: LocationData, isSelectedByUser: boolean) {
        const type = MessageType.SET_SELECTED_LOCATION;
        return this.sendMessage(type, { location, isSelectedByUser });
    }

    async authenticateUser(
        credentials: {
            username: string;
            password: string;
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

    async updateAuthCache(field: string, value: boolean | string | null) {
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
        return this.sendMessage<UserLookupData>(type, { email });
    }

    async disableOtherExtensions() {
        const type = MessageType.DISABLE_OTHER_EXTENSIONS;
        return this.sendMessage(type);
    }

    async registerUser(credentials: {
        username: string;
        password: string;
        twoFactor: string;
    }) {
        const type = MessageType.REGISTER_USER;
        return this.sendMessage(type, { credentials });
    }

    async isAuthenticated() {
        const type = MessageType.IS_AUTHENTICATED;
        return this.sendMessage(type);
    }

    async startSocialAuth(provider: SocialAuthProvider, marketingConsent: boolean) {
        const type = MessageType.START_SOCIAL_AUTH;
        return this.sendMessage<StartSocialAuthData>(type, { provider, marketingConsent });
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

    async setSetting<T>(settingId: string, value: T) {
        const type = MessageType.SET_SETTING_VALUE;
        return this.sendMessage(type, { settingId, value });
    }

    async getUsername() {
        const type = MessageType.GET_USERNAME;
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

    async setExclusionsMode(mode: ExclusionsMode) {
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

    async setRateModalViewed() {
        const type = MessageType.SET_RATE_MODAL_VIEWED;
        return this.sendMessage(type);
    }

    async setNotificationViewed(withDelay: boolean) {
        const type = MessageType.SET_NOTIFICATION_VIEWED;
        return this.sendMessage(type, { withDelay });
    }

    async setHintPopupViewed() {
        const type = MessageType.SET_HINT_POPUP_VIEWED;
        return this.sendMessage(type);
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
    async setFlag(key: string, value: string | boolean) {
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

    addExclusionsMap(exclusionsMap: ExclusionsContentMap) {
        const type = MessageType.ADD_EXCLUSIONS_MAP;
        return this.sendMessage(type, { exclusionsMap });
    }

    addCustomDnsServer(dnsServerData: DnsServerData) {
        const type = MessageType.ADD_CUSTOM_DNS_SERVER;
        return this.sendMessage(type, { dnsServerData });
    }

    editCustomDnsServer(dnsServerData: DnsServerData) {
        const type = MessageType.EDIT_CUSTOM_DNS_SERVER;
        return this.sendMessage(type, { dnsServerData });
    }

    removeCustomDnsServer(dnsServerId: string) {
        const type = MessageType.REMOVE_CUSTOM_DNS_SERVER;
        return this.sendMessage(type, { dnsServerId });
    }

    restoreCustomDnsServersData() {
        const type = MessageType.RESTORE_CUSTOM_DNS_SERVERS_DATA;
        return this.sendMessage(type);
    }

    resendConfirmRegistrationLink(displayNotification: boolean) {
        const type = MessageType.RESEND_CONFIRM_REGISTRATION_LINK;
        return this.sendMessage(type, { displayNotification });
    }

    /**
     * Returns logs from the background page
     */
    getLogs() {
        const type = MessageType.GET_LOGS;
        return this.sendMessage(type);
    }

    /**
     * Returns app version from background page
     */
    getAppVersion() {
        const type = MessageType.GET_APP_VERSION;
        return this.sendMessage(type);
    }
}

export const messenger = new Messenger();
