import browser, { type Runtime } from 'webextension-polyfill';
import { nanoid } from 'nanoid';

import type { LimitedOfferData } from '../background/limitedOfferService';
import type { StartSocialAuthData, UserLookupData } from '../background/messaging/messagingTypes';
import type { DnsServerData } from '../background/schema';
import type { LocationData } from '../popup/stores/VpnStore';
import type {
    TelemetryScreenName,
    TelemetryActionName,
    TelemetryActionToScreenMap,
} from '../background/telemetry/telemetryEnums';
import { ForwarderUrlQueryKey } from '../background/config';
import { type LocationsTab } from '../background/endpoints/locationsEnums';
import { type StatisticsByRange, type StatisticsRange } from '../background/statistics/statisticsTypes';

import { type ExclusionsData, type ExclusionsMode, type ServiceDto } from './exclusionsConstants';
import { log } from './logger';
import { MessageType, type SocialAuthProvider, type ExclusionsContentMap } from './constants';
import { type NotifierType } from './notifier';

/**
 * Message interface that emits background page.
 */
export interface Message {
    /**
     * Type of the message.
     */
    type: MessageType;

    /**
     * Data of the message.
     */
    data: any;
}

/**
 * Function that checks if the message is a valid {@link Message}.
 *
 * @param message Message to check.
 *
 * @returns True if the message is a valid message, false otherwise.
 */
export const isMessage = (message: unknown): message is Message => {
    if (typeof message !== 'object' || message === null) {
        return false;
    }

    const { type } = message as Message;

    return (
        typeof type === 'string'
        && Object.values(MessageType).includes(type)
    );
};

/**
 * Notifier message interface that emits notifier.
 */
export interface NotifierMessage {
    /**
     * Type of the notifier message.
     */
    type: NotifierType;

    /**
     * Data of the message.
     */
    data: any;

    /**
     * Optional value of the message.
     * Some messages may have a value, for example when setting updated
     * it sends a new value of the setting attached.
     */
    value?: any,
}

export interface LongLivedConnectionResult {
    /**
     * Callback function which disconnects from the background page.
     */
    onUnload: () => void;

    /**
     * Port ID of the connection.
     */
    portId: string;
}

class Messenger {
    async sendMessage<T>(type: string, data?: T) {
        log.debug(`Request type: "${type}"`);
        if (data) {
            log.debug('Request data:', data);
        }

        const response = await browser.runtime.sendMessage({ type, data });

        if (response) {
            log.debug(`Response type: "${type}"`);
            log.debug('Response data:', response);
        }

        // TODO: This is temporary fix of message type,
        // it should be refactored to support `unknown` type (AG-41896)
        return response as any;
    }

    /**
     * Used to receive notifications from background page
     * @param events Events for listening
     * @param callback Event listener callback
     */
    createEventListener = async (events: NotifierType[], callback: (...args: NotifierMessage[]) => void) => {
        const eventListener = (...args: NotifierMessage[]) => {
            callback(...args);
        };

        let listenerId = await this.sendMessage(MessageType.ADD_EVENT_LISTENER, { events });

        const onUpdateListeners = async () => {
            const response = await this.sendMessage(MessageType.ADD_EVENT_LISTENER, { events });
            listenerId = response.listenerId;
        };

        const messageHandler = (message: unknown) => {
            if (!isMessage(message)) {
                log.error('Invalid message received:', message);
                return;
            }

            if (message.type === MessageType.NOTIFY_LISTENERS) {
                const [type, data, value] = message.data;
                eventListener({ type, data, value });
            }
            if (message.type === MessageType.UPDATE_LISTENERS) {
                onUpdateListeners();
            }
        };

        const onUnload = async () => {
            if (listenerId) {
                browser.runtime.onMessage.removeListener(messageHandler);
                window.removeEventListener('beforeunload', onUnload);
                window.removeEventListener('unload', onUnload);

                await this.sendMessage(MessageType.REMOVE_EVENT_LISTENER, { listenerId });
                listenerId = null;
            }
        };

        browser.runtime.onMessage.addListener(messageHandler);
        window.addEventListener('beforeunload', onUnload);
        window.addEventListener('unload', onUnload);

        return onUnload;
    };

    /**
     * Creates long lived connections between popup and background page
     * @param events
     * @param callback
     */
    createLongLivedConnection = (
        events: NotifierType[],
        callback: (...args: NotifierMessage[]) => void,
    ): LongLivedConnectionResult => {
        const eventListener = (...args: NotifierMessage[]) => {
            callback(...args);
        };

        const portId = `popup_${nanoid()}`;
        let port: Runtime.Port;
        let forceDisconnected = false;

        const connect = () => {
            port = browser.runtime.connect({ name: portId });
            port.postMessage({ type: MessageType.ADD_LONG_LIVED_CONNECTION, data: { events } });

            port.onMessage.addListener((message) => {
                if (!isMessage(message)) {
                    log.error('Invalid message received:', message);
                    return;
                }

                if (message.type === MessageType.NOTIFY_LISTENERS) {
                    const [type, data, value] = message.data;
                    eventListener({ type, data, value });
                }
            });

            port.onDisconnect.addListener(() => {
                if (browser.runtime.lastError) {
                    log.debug(browser.runtime.lastError.message);
                }
                // we try to connect again if the background page was terminated
                if (!forceDisconnected) {
                    connect();
                }
            });
        };

        connect();

        const onUnload = () => {
            if (port) {
                forceDisconnected = true;
                port.disconnect();
            }
        };

        window.addEventListener('beforeunload', onUnload);
        window.addEventListener('unload', onUnload);

        return {
            onUnload,
            portId,
        };
    };

    async getPopupData(url: string | null, numberOfTries: number) {
        const type = MessageType.GET_POPUP_DATA;
        return this.sendMessage(type, { url, numberOfTries });
    }

    /**
     * Sends a message to the background page to get limited data offer for the user.
     *
     * @returns Returns a promise that resolves to an object with the limited offer data or null.
     */
    async getLimitedOfferData(): Promise<LimitedOfferData | null> {
        const type = MessageType.GET_LIMITED_OFFER_DATA;
        return this.sendMessage(type);
    }

    /**
     * Sends a message to the background page to update locations from the server.
     *
     * @returns Returns a promise that resolves to an array of locations
     * or null if locations update failed.
     */
    async forceUpdateLocations(): Promise<any> {
        const type = MessageType.FORCE_UPDATE_LOCATIONS;
        return this.sendMessage(type);
    }

    /**
     * Sends a message to the background page to save locations tab.
     *
     * @param locationsTab New locations tab.
     */
    async saveLocationsTab(locationsTab: LocationsTab): Promise<void> {
        const type = MessageType.SAVED_LOCATIONS_SAVE_TAB;
        return this.sendMessage(type, { locationsTab });
    }

    /**
     * Sends a message to the background page to add location to saved locations.
     *
     * @param locationId Location ID to add.
     */
    async addSavedLocation(locationId: string): Promise<void> {
        const type = MessageType.SAVED_LOCATIONS_ADD;
        return this.sendMessage(type, { locationId });
    }

    /**
     * Sends a message to the background page to remove location from saved locations.
     *
     * @param locationId Location ID to remove.
     */
    async removeSavedLocation(locationId: string): Promise<void> {
        const type = MessageType.SAVED_LOCATIONS_REMOVE;
        return this.sendMessage(type, { locationId });
    }

    /**
     * Sends a message to the background page to get options data.
     *
     * @param isDataRefresh If `true`, skips new `pageId` generation.
     * Use this when you want to refresh the data without needing to
     * generate a new `pageId`.
     *
     * @returns Returns a promise that resolves to the options data.
     */
    async getOptionsData(isDataRefresh: boolean) {
        const type = MessageType.GET_OPTIONS_DATA;
        return this.sendMessage(type, { isDataRefresh });
    }

    /**
     * Sends a message to the background page to get consent data.
     *
     * @returns Data needed for the consent page.
     */
    async getConsentData() {
        const type = MessageType.GET_CONSENT_DATA;
        return this.sendMessage(type);
    }

    /**
     * Sends a message to the background page to set consent data,
     * which includes user agreement to the policy and help us improve checkbox.
     *
     * @param policyAgreement Policy agreement status.
     * @param helpUsImprove Help us improve status.
     */
    async setConsentData(policyAgreement: boolean, helpUsImprove: boolean) {
        const type = MessageType.SET_CONSENT_DATA;
        return this.sendMessage(type, { policyAgreement, helpUsImprove });
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

    async hideRateModalAfterCancel() {
        const type = MessageType.HIDE_RATE_MODAL_AFTER_CANCEL;
        return this.sendMessage(type);
    }

    async hideRateModalAfterRate() {
        const type = MessageType.HIDE_RATE_MODAL_AFTER_RATE;
        return this.sendMessage(type);
    }

    async hideMobileEdgePromoBanner() {
        const type = MessageType.HIDE_MOBILE_EDGE_PROMO_BANNER;
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

    /**
     * Opens Premium Promo Page in new tab.
     */
    async openPremiumPromoPage() {
        return this.openForwarderUrlWithEmail(ForwarderUrlQueryKey.UpgradeLicense);
    }

    /**
     * Opens Subscribe Promo Page in new tab.
     */
    async openSubscribePromoPage() {
        return this.openForwarderUrlWithEmail(ForwarderUrlQueryKey.Subscribe);
    }

    /**
     * Opens forwarder URL in new tab by appending email query param if user is logged in.
     *
     * @param forwarderUrlQueryKey Forwarder query key.
     */
    async openForwarderUrlWithEmail(forwarderUrlQueryKey: ForwarderUrlQueryKey) {
        const type = MessageType.OPEN_FORWARDER_URL_WITH_EMAIL;
        return this.sendMessage(type, { forwarderUrlQueryKey });
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
     * Sends a message to the background page to store an authId for email confirmation.
     * It is needed for another code request.
     *
     * @param authId AuthId for email confirmation.
     */
    setEmailConfirmationAuthId(authId: string) {
        const type = MessageType.SET_EMAIL_CONFIRMATION_AUTH_ID;
        return this.sendMessage(type, { authId });
    }

    /**
     * Sends a message to the background page to ask for a new email confirmation code.
     */
    resendEmailConfirmationCode() {
        const type = MessageType.RESEND_EMAIL_CONFIRMATION_CODE;
        return this.sendMessage(type);
    }

    /**
     * Sends a message to the background page to get the resend code countdown.
     *
     * @returns Number of seconds left before the user can request a new code.
     */
    async getResendCodeCountdown() {
        const type = MessageType.GET_RESEND_CODE_COUNTDOWN;
        return this.sendMessage(type);
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

    recalculatePings() {
        const type = MessageType.RECALCULATE_PINGS;
        return this.sendMessage(type);
    }

    /**
     * Sends a message to the background to send a page view telemetry event.
     *
     * NOTE: Do not await this function, as it is not necessary to wait for the response.
     *
     * @param screenName Name of the screen.
     * @param pageId Page ID of the screen.
     */
    async sendPageViewTelemetryEvent(
        screenName: TelemetryScreenName,
        pageId: string,
    ): Promise<void> {
        const type = MessageType.TELEMETRY_EVENT_SEND_PAGE_VIEW;
        return this.sendMessage(type, { screenName, pageId });
    }

    /**
     * Sends a message to the background to send a custom telemetry event.
     *
     * NOTE: Do not await this function, as it is not necessary to wait for the response.
     *
     * @param event Custom telemetry event data.
     */
    async sendCustomTelemetryEvent<T extends TelemetryActionName>(
        actionName: T,
        screenName: TelemetryActionToScreenMap[T],
    ): Promise<void> {
        const type = MessageType.TELEMETRY_EVENT_SEND_CUSTOM;
        return this.sendMessage(type, { actionName, screenName });
    }

    /**
     * Removes opened page from the list of opened pages of telemetry module.
     *
     * @param pageId ID of page to remove.
     */
    async removeTelemetryOpenedPage(pageId: string): Promise<void> {
        const type = MessageType.TELEMETRY_EVENT_REMOVE_OPENED_PAGE;
        return this.sendMessage(type, { pageId });
    }

    /**
     * Retrieves statistics data for the given range.
     *
     * @param range The range for which statistics data is needed.
     *
     * @returns Stats data for the given range.
     */
    async getStatsByRange(range: StatisticsRange): Promise<StatisticsByRange> {
        const type = MessageType.STATISTICS_GET_BY_RANGE;
        return this.sendMessage(type, { range });
    }

    /**
     * Clears all statistics.
     *
     * WARNING: This method will delete all statistics data,
     * make sure that you know what you are doing before calling it.
     */
    async clearStatistics(): Promise<void> {
        const type = MessageType.STATISTICS_CLEAR;
        return this.sendMessage(type);
    }

    /**
     * Sets the statistics disabled state.
     *
     * @param isDisabled If `true`, statistics will be disabled and no data will be collected.
     */
    async setStatisticsIsDisabled(isDisabled: boolean): Promise<void> {
        const type = MessageType.STATISTICS_SET_IS_DISABLED;
        return this.sendMessage(type, { isDisabled });
    }
}

export const messenger = new Messenger();
