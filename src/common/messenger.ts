import browser, { type Runtime } from 'webextension-polyfill';
import { nanoid } from 'nanoid';

import type { DnsServerData } from '../background/schema';
import type { LocationData } from '../popup/stores/VpnStore';
import {
    type TelemetryActionName,
    type TelemetryActionToScreenMap,
    type TelemetryScreenName,
} from '../background/telemetry/telemetryEnums';
import { ForwarderUrlQueryKey } from '../background/config';
import { type LocationsTab } from '../background/endpoints/locationsEnums';
import { type StatisticsRange } from '../background/statistics/statisticsTypes';
import { type AuthCacheKey, type AuthCacheValue } from '../background/authentication/authCacheTypes';
import { type WebAuthAction } from '../background/auth/webAuthEnums';
import { type ExclusionsMap } from '../background/exclusions/ExclusionsService';

import { type ExclusionsMode } from './exclusionsConstants';
import { log } from './logger';
import {
    type ExtractMessageResponse,
    MessageType,
    type ValidMessageTypes,
    type ExtractMessageData,
    type Message,
} from './constants';
import { type NotifierType } from './notifier';

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
        && Object.values(MessageType).includes(type as MessageType)
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
    async sendMessage<K extends ValidMessageTypes>(
        type: K,
        data?: ExtractMessageData<K>,
    ): Promise<ExtractMessageResponse<K>> {
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
     * Used to receive notifications from background page.
     *
     * @param events Events for listening
     * @param callback Event listener callback
     *
     * @returns function to remove event listener.
     */
    createEventListener = async (
        events: NotifierType[],
        callback: (...args: NotifierMessage[]) => void,
    ): Promise<() => Promise<void>> => {
        const eventListener = (...args: NotifierMessage[]): void => {
            callback(...args);
        };

        let listenerId: string | null = await this.sendMessage(MessageType.ADD_EVENT_LISTENER, { events });

        const onUpdateListeners = async (): Promise<void> => {
            const response = await this.sendMessage(MessageType.ADD_EVENT_LISTENER, { events });
            listenerId = response;
        };

        const messageHandler = (message: unknown): void => {
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

        const onUnload = async (): Promise<void> => {
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
     * Creates long lived connections between popup and background page.
     *
     * @param events
     * @param callback
     *
     * @returns Function to disconnect long lived connection.
     */
    createLongLivedConnection = (
        events: NotifierType[],
        callback: (...args: NotifierMessage[]) => void,
    ): LongLivedConnectionResult => {
        const eventListener = (...args: NotifierMessage[]): void => {
            callback(...args);
        };

        const portId = `popup_${nanoid()}`;
        let port: Runtime.Port;
        let forceDisconnected = false;

        const connect = (): void => {
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

        const onUnload = (): void => {
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

    async getPopupData(
        url: string | null,
        numberOfTries: number,
    ): Promise<ExtractMessageResponse<MessageType.GET_POPUP_DATA>> {
        const type = MessageType.GET_POPUP_DATA;
        return this.sendMessage(type, { url, numberOfTries });
    }

    /**
     * Sends a message to the background page to get limited data offer for the user.
     *
     * @returns Returns a promise that resolves to an object with the limited offer data or null.
     */
    async getLimitedOfferData(): Promise<ExtractMessageResponse<MessageType.GET_LIMITED_OFFER_DATA>> {
        const type = MessageType.GET_LIMITED_OFFER_DATA;
        return this.sendMessage(type);
    }

    /**
     * Sends a message to the background page to update locations from the server.
     *
     * @returns Returns a promise that resolves to an array of locations
     * or null if locations update failed.
     */
    async forceUpdateLocations(): Promise<ExtractMessageResponse<MessageType.FORCE_UPDATE_LOCATIONS>> {
        const type = MessageType.FORCE_UPDATE_LOCATIONS;
        return this.sendMessage(type);
    }

    /**
     * Sends a message to the background page to save locations tab.
     *
     * @param locationsTab New locations tab.
     *
     * @returns Promise that resolves when locations tab is saved.
     */
    async saveLocationsTab(
        locationsTab: LocationsTab,
    ): Promise<ExtractMessageResponse<MessageType.SAVED_LOCATIONS_SAVE_TAB>> {
        const type = MessageType.SAVED_LOCATIONS_SAVE_TAB;
        return this.sendMessage(type, { locationsTab });
    }

    /**
     * Sends a message to the background page to add location to saved locations.
     *
     * @param locationId Location ID to add.
     *
     * @returns Promise that resolves when location is added.
     */
    async addSavedLocation(locationId: string): Promise<ExtractMessageResponse<MessageType.SAVED_LOCATIONS_ADD>> {
        const type = MessageType.SAVED_LOCATIONS_ADD;
        return this.sendMessage(type, { locationId });
    }

    /**
     * Sends a message to the background page to remove location from saved locations.
     *
     * @param locationId Location ID to remove.
     *
     * @returns Promise that resolves when location is removed.
     */
    async removeSavedLocation(locationId: string): Promise<ExtractMessageResponse<MessageType.SAVED_LOCATIONS_REMOVE>> {
        const type = MessageType.SAVED_LOCATIONS_REMOVE;
        return this.sendMessage(type, { locationId });
    }

    /**
     * Sends a message to the background page to get options data.
     *
     * @param isRefresh If `true`, skips new `pageId` generation.
     * Use this when you want to refresh the data without needing to
     * generate a new `pageId`.
     *
     * @returns Returns a promise that resolves to the options data.
     */
    async getOptionsData(isRefresh: boolean): Promise<ExtractMessageResponse<MessageType.GET_OPTIONS_DATA>> {
        const type = MessageType.GET_OPTIONS_DATA;
        return this.sendMessage(type, { isRefresh });
    }

    /**
     * Sends a message to the background page to get consent data.
     *
     * @returns Data needed for the consent page.
     */
    async getConsentData(): Promise<ExtractMessageResponse<MessageType.GET_CONSENT_DATA>> {
        const type = MessageType.GET_CONSENT_DATA;
        return this.sendMessage(type);
    }

    /**
     * Sends a message to the background page to set consent data,
     * which includes user agreement to the policy and help us improve checkbox.
     *
     * @param policyAgreement Policy agreement status.
     * @param helpUsImprove Help us improve status.
     *
     * @returns Promise that resolves when consent data is set.
     */
    async setConsentData(
        policyAgreement: boolean,
        helpUsImprove: boolean,
    ): Promise<ExtractMessageResponse<MessageType.SET_CONSENT_DATA>> {
        const type = MessageType.SET_CONSENT_DATA;
        return this.sendMessage(type, { policyAgreement, helpUsImprove });
    }

    async getVpnFailurePage(): Promise<ExtractMessageResponse<MessageType.GET_VPN_FAILURE_PAGE>> {
        const type = MessageType.GET_VPN_FAILURE_PAGE;
        return this.sendMessage(type);
    }

    async openOptionsPage(): Promise<ExtractMessageResponse<MessageType.OPEN_OPTIONS_PAGE>> {
        const type = MessageType.OPEN_OPTIONS_PAGE;
        return this.sendMessage(type);
    }

    async openFreeGbsPage(): Promise<ExtractMessageResponse<MessageType.OPEN_FREE_GBS_PAGE>> {
        const type = MessageType.OPEN_FREE_GBS_PAGE;
        return this.sendMessage(type);
    }

    async getBonusesData(): Promise<ExtractMessageResponse<MessageType.GET_BONUSES_DATA>> {
        const type = MessageType.GET_BONUSES_DATA;
        return this.sendMessage(type);
    }

    async setCurrentLocation(
        location: LocationData,
        isSelectedByUser: boolean,
    ): Promise<ExtractMessageResponse<MessageType.SET_SELECTED_LOCATION>> {
        const type = MessageType.SET_SELECTED_LOCATION;
        return this.sendMessage(type, { location, isSelectedByUser });
    }

    async deauthenticateUser(): Promise<ExtractMessageResponse<MessageType.DEAUTHENTICATE_USER>> {
        const type = MessageType.DEAUTHENTICATE_USER;
        return this.sendMessage(type);
    }

    async updateAuthCache(
        field: AuthCacheKey,
        value: AuthCacheValue,
    ): Promise<ExtractMessageResponse<MessageType.UPDATE_AUTH_CACHE>> {
        const type = MessageType.UPDATE_AUTH_CACHE;
        return this.sendMessage(type, { field, value });
    }

    async getCanControlProxy(): Promise<ExtractMessageResponse<MessageType.GET_CAN_CONTROL_PROXY>> {
        const type = MessageType.GET_CAN_CONTROL_PROXY;
        return this.sendMessage(type);
    }

    async enableProxy(force: boolean): Promise<ExtractMessageResponse<MessageType.ENABLE_PROXY>> {
        const type = MessageType.ENABLE_PROXY;
        return this.sendMessage(type, { force });
    }

    async disableProxy(force: boolean): Promise<ExtractMessageResponse<MessageType.DISABLE_PROXY>> {
        const type = MessageType.DISABLE_PROXY;
        return this.sendMessage(type, { force });
    }

    async addUrlToExclusions(
        url: string,
    ): Promise<ExtractMessageResponse<MessageType.ADD_URL_TO_EXCLUSIONS>> {
        const type = MessageType.ADD_URL_TO_EXCLUSIONS;
        return this.sendMessage(type, { url });
    }

    async removeExclusion(id: string): Promise<ExtractMessageResponse<MessageType.REMOVE_EXCLUSION>> {
        const type = MessageType.REMOVE_EXCLUSION;
        return this.sendMessage(type, { id });
    }

    async disableVpnByUrl(
        url: string,
    ): Promise<ExtractMessageResponse<MessageType.DISABLE_VPN_BY_URL>> {
        const type = MessageType.DISABLE_VPN_BY_URL;
        return this.sendMessage(type, { url });
    }

    async enableVpnByUrl(
        url: string,
    ): Promise<ExtractMessageResponse<MessageType.ENABLE_VPN_BY_URL>> {
        const type = MessageType.ENABLE_VPN_BY_URL;
        return this.sendMessage(type, { url });
    }

    async toggleExclusionState(
        id: string,
    ): Promise<ExtractMessageResponse<MessageType.TOGGLE_EXCLUSION_STATE>> {
        const type = MessageType.TOGGLE_EXCLUSION_STATE;
        return this.sendMessage(type, { id });
    }

    async restoreExclusions(): Promise<ExtractMessageResponse<MessageType.RESTORE_EXCLUSIONS>> {
        const type = MessageType.RESTORE_EXCLUSIONS;
        return this.sendMessage(type);
    }

    async toggleServices(ids: string[]): Promise<ExtractMessageResponse<MessageType.TOGGLE_SERVICES>> {
        const type = MessageType.TOGGLE_SERVICES;
        return this.sendMessage(type, { ids });
    }

    async resetServiceData(
        serviceId: string,
    ): Promise<ExtractMessageResponse<MessageType.RESET_SERVICE_DATA>> {
        const type = MessageType.RESET_SERVICE_DATA;
        return this.sendMessage(type, { serviceId });
    }

    async clearExclusionsList():
    Promise<ExtractMessageResponse<MessageType.CLEAR_EXCLUSIONS_LIST>> {
        const type = MessageType.CLEAR_EXCLUSIONS_LIST;
        return this.sendMessage(type);
    }

    async disableOtherExtensions():
    Promise<ExtractMessageResponse<MessageType.DISABLE_OTHER_EXTENSIONS>> {
        const type = MessageType.DISABLE_OTHER_EXTENSIONS;
        return this.sendMessage(type);
    }

    async isAuthenticated(): Promise<ExtractMessageResponse<MessageType.IS_AUTHENTICATED>> {
        const type = MessageType.IS_AUTHENTICATED;
        return this.sendMessage(type);
    }

    async clearPermissionsError(): Promise<ExtractMessageResponse<MessageType.CLEAR_PERMISSIONS_ERROR>> {
        const type = MessageType.CLEAR_PERMISSIONS_ERROR;
        return this.sendMessage(type);
    }

    async checkPermissions(): Promise<ExtractMessageResponse<MessageType.CHECK_PERMISSIONS>> {
        const type = MessageType.CHECK_PERMISSIONS;
        return this.sendMessage(type);
    }

    async getExclusionsInverted():
    Promise<ExtractMessageResponse<MessageType.GET_EXCLUSIONS_INVERTED>> {
        const type = MessageType.GET_EXCLUSIONS_INVERTED;
        return this.sendMessage(type);
    }

    async getSetting(settingId: string): Promise<ExtractMessageResponse<MessageType.GET_SETTING_VALUE>> {
        const type = MessageType.GET_SETTING_VALUE;
        return this.sendMessage(type, { settingId });
    }

    async setSetting(
        settingId: string,
        value: boolean | string,
    ): Promise<ExtractMessageResponse<MessageType.SET_SETTING_VALUE>> {
        const type = MessageType.SET_SETTING_VALUE;
        return this.sendMessage(type, { settingId, value });
    }

    async getUsername(): Promise<ExtractMessageResponse<MessageType.GET_USERNAME>> {
        const type = MessageType.GET_USERNAME;
        return this.sendMessage(type);
    }

    /**
     * Updates user decision on marketing consent.
     *
     * @param newMarketingConsent New marketing consent value.
     */
    async updateMarketingConsent(
        newMarketingConsent: boolean,
    ): Promise<ExtractMessageResponse<MessageType.UPDATE_MARKETING_CONSENT>> {
        const type = MessageType.UPDATE_MARKETING_CONSENT;
        return this.sendMessage(type, { newMarketingConsent });
    }

    async getExclusionsData(): Promise<ExtractMessageResponse<MessageType.GET_EXCLUSIONS_DATA>> {
        const type = MessageType.GET_EXCLUSIONS_DATA;
        return this.sendMessage(type);
    }

    async setExclusionsMode(
        mode: ExclusionsMode,
    ): Promise<ExtractMessageResponse<MessageType.SET_EXCLUSIONS_MODE>> {
        const type = MessageType.SET_EXCLUSIONS_MODE;
        return this.sendMessage(type, { mode });
    }

    async getSelectedLocation(): Promise<ExtractMessageResponse<MessageType.GET_SELECTED_LOCATION>> {
        const type = MessageType.GET_SELECTED_LOCATION;
        return this.sendMessage(type);
    }

    async checkIsPremiumToken():
    Promise<ExtractMessageResponse<MessageType.CHECK_IS_PREMIUM_TOKEN>> {
        const type = MessageType.CHECK_IS_PREMIUM_TOKEN;
        return this.sendMessage(type);
    }

    async hideRateModalAfterCancel():
    Promise<ExtractMessageResponse<MessageType.HIDE_RATE_MODAL_AFTER_CANCEL>> {
        const type = MessageType.HIDE_RATE_MODAL_AFTER_CANCEL;
        return this.sendMessage(type);
    }

    async hideRateModalAfterRate():
    Promise<ExtractMessageResponse<MessageType.HIDE_RATE_MODAL_AFTER_RATE>> {
        const type = MessageType.HIDE_RATE_MODAL_AFTER_RATE;
        return this.sendMessage(type);
    }

    async hideMobileEdgePromoBanner():
    Promise<ExtractMessageResponse<MessageType.HIDE_MOBILE_EDGE_PROMO_BANNER>> {
        const type = MessageType.HIDE_MOBILE_EDGE_PROMO_BANNER;
        return this.sendMessage(type);
    }

    async setNotificationViewed(
        withDelay: boolean,
    ): Promise<ExtractMessageResponse<MessageType.SET_NOTIFICATION_VIEWED>> {
        const type = MessageType.SET_NOTIFICATION_VIEWED;
        return this.sendMessage(type, { withDelay });
    }

    async setHintPopupViewed(): Promise<ExtractMessageResponse<MessageType.SET_HINT_POPUP_VIEWED>> {
        const type = MessageType.SET_HINT_POPUP_VIEWED;
        return this.sendMessage(type);
    }

    async openTab(url: string): Promise<ExtractMessageResponse<MessageType.OPEN_TAB>> {
        const type = MessageType.OPEN_TAB;
        return this.sendMessage(type, { url });
    }

    async reportBug(
        email: string,
        message: string,
        includeLog: boolean,
    ): Promise<ExtractMessageResponse<MessageType.REPORT_BUG>> {
        const type = MessageType.REPORT_BUG;
        return this.sendMessage(type, { email, message, includeLog });
    }

    /**
     * Opens Premium Promo Page in new tab.
     * @returns Promise that resolves when Premium Promo Page is opened.
     */
    async openPremiumPromoPage():
    Promise<ExtractMessageResponse<MessageType.OPEN_FORWARDER_URL_WITH_EMAIL>> {
        return this.openForwarderUrlWithEmail(ForwarderUrlQueryKey.UpgradeLicense);
    }

    /**
     * Opens Subscribe Promo Page in new tab.
     * @returns Promise that resolves when Subscribe Promo Page is opened.
     */
    async openSubscribePromoPage():
    Promise<ExtractMessageResponse<MessageType.OPEN_FORWARDER_URL_WITH_EMAIL>> {
        return this.openForwarderUrlWithEmail(ForwarderUrlQueryKey.Subscribe);
    }

    /**
     * Opens forwarder URL in new tab by appending email query param if user is logged in.
     *
     * @param forwarderUrlQueryKey Forwarder query key.
     *
     * @returns Promise that resolves when forwarder URL is opened.
     */
    async openForwarderUrlWithEmail(
        forwarderUrlQueryKey: ForwarderUrlQueryKey,
    ): Promise<ExtractMessageResponse<MessageType.OPEN_FORWARDER_URL_WITH_EMAIL>> {
        const type = MessageType.OPEN_FORWARDER_URL_WITH_EMAIL;
        return this.sendMessage(type, { forwarderUrlQueryKey });
    }

    /**
     * Sets value for key in flags storage
     *
     * @param key
     * @param value
     *
     * @returns Promise that resolves when flag is set.
     */
    async setFlag(key: string, value: boolean): Promise<ExtractMessageResponse<MessageType.SET_FLAG>> {
        const type = MessageType.SET_FLAG;
        return this.sendMessage(type, { key, value });
    }

    getGeneralExclusions():
    Promise<ExtractMessageResponse<MessageType.GET_GENERAL_EXCLUSIONS>> {
        const type = MessageType.GET_GENERAL_EXCLUSIONS;
        return this.sendMessage(type);
    }

    getSelectiveExclusions():
    Promise<ExtractMessageResponse<MessageType.GET_SELECTIVE_EXCLUSIONS>> {
        const type = MessageType.GET_SELECTIVE_EXCLUSIONS;
        return this.sendMessage(type);
    }

    addRegularExclusions(
        exclusions: string[],
    ): Promise<ExtractMessageResponse<MessageType.ADD_REGULAR_EXCLUSIONS>> {
        const type = MessageType.ADD_REGULAR_EXCLUSIONS;
        return this.sendMessage(type, { exclusions });
    }

    addSelectiveExclusions(
        exclusions: string[],
    ): Promise<ExtractMessageResponse<MessageType.ADD_SELECTIVE_EXCLUSIONS>> {
        const type = MessageType.ADD_SELECTIVE_EXCLUSIONS;
        return this.sendMessage(type, { exclusions });
    }

    addExclusionsMap(
        exclusionsMap: ExclusionsMap,
    ): Promise<ExtractMessageResponse<MessageType.ADD_EXCLUSIONS_MAP>> {
        const type = MessageType.ADD_EXCLUSIONS_MAP;
        return this.sendMessage(type, { exclusionsMap });
    }

    addCustomDnsServer(
        dnsServerData: DnsServerData,
    ): Promise<ExtractMessageResponse<MessageType.ADD_CUSTOM_DNS_SERVER>> {
        const type = MessageType.ADD_CUSTOM_DNS_SERVER;
        return this.sendMessage(type, { dnsServerData });
    }

    editCustomDnsServer(
        dnsServerData: DnsServerData,
    ): Promise<ExtractMessageResponse<MessageType.EDIT_CUSTOM_DNS_SERVER>> {
        const type = MessageType.EDIT_CUSTOM_DNS_SERVER;
        return this.sendMessage(type, { dnsServerData });
    }

    removeCustomDnsServer(
        dnsServerId: string,
    ): Promise<ExtractMessageResponse<MessageType.REMOVE_CUSTOM_DNS_SERVER>> {
        const type = MessageType.REMOVE_CUSTOM_DNS_SERVER;
        return this.sendMessage(type, { dnsServerId });
    }

    restoreCustomDnsServersData():
    Promise<ExtractMessageResponse<MessageType.RESTORE_CUSTOM_DNS_SERVERS_DATA>> {
        const type = MessageType.RESTORE_CUSTOM_DNS_SERVERS_DATA;
        return this.sendMessage(type);
    }

    /**
     * Gets logs from the background page.
     *
     * @returns Logs from the background page.
     */
    getLogs(): Promise<ExtractMessageResponse<MessageType.GET_LOGS>> {
        const type = MessageType.GET_LOGS;
        return this.sendMessage(type);
    }

    /**
     * Gets app version from background page.
     *
     * @returns App version from background page.
     */
    getAppVersion(): Promise<ExtractMessageResponse<MessageType.GET_APP_VERSION>> {
        const type = MessageType.GET_APP_VERSION;
        return this.sendMessage(type);
    }

    recalculatePings(): Promise<ExtractMessageResponse<MessageType.RECALCULATE_PINGS>> {
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
     *
     * @returns Promise that resolves when page view telemetry event is sent.
     */
    async sendPageViewTelemetryEvent(
        screenName: TelemetryScreenName,
        pageId: string,
    ): Promise<ExtractMessageResponse<MessageType.TELEMETRY_EVENT_SEND_PAGE_VIEW>> {
        const type = MessageType.TELEMETRY_EVENT_SEND_PAGE_VIEW;
        return this.sendMessage(type, { screenName, pageId });
    }

    /**
     * Sends a message to the background to send a custom telemetry event.
     *
     * NOTE: Do not await this function, as it is not necessary to wait for the response.
     *
     * @returns Promise that resolves when custom telemetry event is sent.
     * @param actionName Name of the action.
     * @param screenName Screen that action is related to.
     * @param label Optional label for the event.
     */
    async sendCustomTelemetryEvent<T extends TelemetryActionName>(
        actionName: T,
        screenName: TelemetryActionToScreenMap[T],
        label?: string,
    ): Promise<ExtractMessageResponse<MessageType.TELEMETRY_EVENT_SEND_CUSTOM>> {
        const type = MessageType.TELEMETRY_EVENT_SEND_CUSTOM;
        return this.sendMessage(type, { actionName, screenName, label });
    }

    /**
     * Removes opened page from the list of opened pages of telemetry module.
     *
     * @param pageId ID of page to remove.
     *
     * @returns Promise that resolves when opened page is removed.
     */
    async removeTelemetryOpenedPage(
        pageId: string,
    ): Promise<ExtractMessageResponse<MessageType.TELEMETRY_EVENT_REMOVE_OPENED_PAGE>> {
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
    async getStatsByRange(
        range: StatisticsRange,
    ): Promise<ExtractMessageResponse<MessageType.STATISTICS_GET_BY_RANGE>> {
        const type = MessageType.STATISTICS_GET_BY_RANGE;
        return this.sendMessage(type, { range });
    }

    /**
     * Clears all statistics.
     *
     * WARNING: This method will delete all statistics data,
     * make sure that you know what you are doing before calling it.
     *
     * @returns Promise that resolves when statistics are cleared.
     */
    async clearStatistics(): Promise<ExtractMessageResponse<MessageType.STATISTICS_CLEAR>> {
        const type = MessageType.STATISTICS_CLEAR;
        return this.sendMessage(type);
    }

    /**
     * Sets the statistics disabled state.
     *
     * @param isDisabled If `true`, statistics will be disabled and no data will be collected.
     * @returns Promise that resolves when statistics disabled state is set.
     */
    async setStatisticsIsDisabled(
        isDisabled: boolean,
    ): Promise<ExtractMessageResponse<MessageType.STATISTICS_SET_IS_DISABLED>> {
        const type = MessageType.STATISTICS_SET_IS_DISABLED;
        return this.sendMessage(type, { isDisabled });
    }

    /**
     * Sends a web authentication flow action to the background.
     *
     * @param action Action to send.
     */
    async sendWebAuthAction(action: WebAuthAction): Promise<ExtractMessageResponse<MessageType.SEND_WEB_AUTH_ACTION>> {
        const type = MessageType.SEND_WEB_AUTH_ACTION;
        return this.sendMessage(type, { action });
    }

    /**
     * Gets startup data from the background page.
     *
     * @returns Promise with all required data for onboarding and upgrade screen.
     */
    async getStartupData(): Promise<ExtractMessageResponse<MessageType.GET_STARTUP_DATA>> {
        const type = MessageType.GET_STARTUP_DATA;
        return this.sendMessage(type);
    }
}

export const messenger = new Messenger();
