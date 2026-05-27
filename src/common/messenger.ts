import browser, { type Runtime } from 'webextension-polyfill';
import { nanoid } from 'nanoid';

import type { DnsServerData } from '../background/schema';
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

import { type ExclusionsMap, type ExclusionsMode } from './exclusionsConstants';
import { log } from './logger';
import {
    type ExtractMessageResponse,
    MessageType,
    type ValidMessageTypes,
    type ExtractMessageData,
    type Message,
    type QuickConnectSetting,
} from './constants';
import { type NotifierType } from './notifier';
import { type NotifierMessage } from './notifierEvents';

export type { NotifierMessage } from './notifierEvents';

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
    public async sendMessage<K extends ValidMessageTypes>(
        type: K,
        data?: ExtractMessageData<K>,
    ): Promise<ExtractMessageResponse<K>> {
        log.debug(`[vpn.Messenger.sendMessage]: Request type: "${type}"`);
        if (data) {
            log.debug('[vpn.Messenger.sendMessage]: Request data:', data);
        }

        const response = await browser.runtime.sendMessage({ type, data });

        if (response) {
            log.debug(`[vpn.Messenger.sendMessage]: Response type: "${type}"`);
            log.debug('[vpn.Messenger.sendMessage]: Response data:', response);
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
    public createEventListener = async (
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
                log.error('[vpn.Messenger]: Invalid message received:', message);
                return;
            }

            if (message.type === MessageType.NOTIFY_LISTENERS) {
                const [type, data, value] = message.data;
                eventListener({ type, data, value } as NotifierMessage);
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
    public createLongLivedConnection = (
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
                    log.error('[vpn.Messenger]: Invalid message received:', message);
                    return;
                }

                if (message.type === MessageType.NOTIFY_LISTENERS) {
                    const [type, data, value] = message.data;
                    eventListener({ type, data, value } as NotifierMessage);
                }
            });

            port.onDisconnect.addListener(() => {
                if (browser.runtime.lastError) {
                    log.debug('[vpn.Messenger]: ', browser.runtime.lastError.message);
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

    public async getPopupData(
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
    public async getLimitedOfferData(): Promise<ExtractMessageResponse<MessageType.GET_LIMITED_OFFER_DATA>> {
        const type = MessageType.GET_LIMITED_OFFER_DATA;
        return this.sendMessage(type);
    }

    /**
     * Sends a message to the background page to update locations from the server.
     *
     * @returns Returns a promise that resolves to an array of locations
     * or null if locations update failed.
     */
    public async forceUpdateLocations(): Promise<ExtractMessageResponse<MessageType.FORCE_UPDATE_LOCATIONS>> {
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
    public async saveLocationsTab(
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
    public async addSavedLocation(
        locationId: string,
    ): Promise<ExtractMessageResponse<MessageType.SAVED_LOCATIONS_ADD>> {
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
    public async removeSavedLocation(
        locationId: string,
    ): Promise<ExtractMessageResponse<MessageType.SAVED_LOCATIONS_REMOVE>> {
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
    public async getOptionsData(isRefresh: boolean): Promise<ExtractMessageResponse<MessageType.GET_OPTIONS_DATA>> {
        const type = MessageType.GET_OPTIONS_DATA;
        return this.sendMessage(type, { isRefresh });
    }

    /**
     * Sends a message to the background page to get consent data.
     *
     * @returns Data needed for the consent page.
     */
    public async getConsentData(): Promise<ExtractMessageResponse<MessageType.GET_CONSENT_DATA>> {
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
    public async setConsentData(
        policyAgreement: boolean,
        helpUsImprove: boolean,
    ): Promise<ExtractMessageResponse<MessageType.SET_CONSENT_DATA>> {
        const type = MessageType.SET_CONSENT_DATA;
        return this.sendMessage(type, { policyAgreement, helpUsImprove });
    }

    public async getVpnFailurePage(): Promise<ExtractMessageResponse<MessageType.GET_VPN_FAILURE_PAGE>> {
        const type = MessageType.GET_VPN_FAILURE_PAGE;
        return this.sendMessage(type);
    }

    public async openOptionsPage(): Promise<ExtractMessageResponse<MessageType.OPEN_OPTIONS_PAGE>> {
        const type = MessageType.OPEN_OPTIONS_PAGE;
        return this.sendMessage(type);
    }

    public async openProfilesPage(): Promise<ExtractMessageResponse<MessageType.OPEN_PROFILES_PAGE>> {
        const type = MessageType.OPEN_PROFILES_PAGE;
        return this.sendMessage(type);
    }

    public async openFreeGbsPage(): Promise<ExtractMessageResponse<MessageType.OPEN_FREE_GBS_PAGE>> {
        const type = MessageType.OPEN_FREE_GBS_PAGE;
        return this.sendMessage(type);
    }

    public async getBonusesData(): Promise<ExtractMessageResponse<MessageType.GET_BONUSES_DATA>> {
        const type = MessageType.GET_BONUSES_DATA;
        return this.sendMessage(type);
    }

    public async setCurrentLocation(
        profileId: string,
        locationId: string,
        persistToProfile = true,
    ): Promise<ExtractMessageResponse<MessageType.SET_SELECTED_LOCATION>> {
        const type = MessageType.SET_SELECTED_LOCATION;
        return this.sendMessage(type, { profileId, locationId, persistToProfile });
    }

    public async deauthenticateUser(): Promise<ExtractMessageResponse<MessageType.DEAUTHENTICATE_USER>> {
        const type = MessageType.DEAUTHENTICATE_USER;
        return this.sendMessage(type);
    }

    public async updateAuthCache(
        field: AuthCacheKey,
        value: AuthCacheValue,
    ): Promise<ExtractMessageResponse<MessageType.UPDATE_AUTH_CACHE>> {
        const type = MessageType.UPDATE_AUTH_CACHE;
        return this.sendMessage(type, { field, value });
    }

    public async getCanControlProxy(): Promise<ExtractMessageResponse<MessageType.GET_CAN_CONTROL_PROXY>> {
        const type = MessageType.GET_CAN_CONTROL_PROXY;
        return this.sendMessage(type);
    }

    public async enableProxy(force: boolean): Promise<ExtractMessageResponse<MessageType.ENABLE_PROXY>> {
        const type = MessageType.ENABLE_PROXY;
        return this.sendMessage(type, { force });
    }

    public async disableProxy(force: boolean): Promise<ExtractMessageResponse<MessageType.DISABLE_PROXY>> {
        const type = MessageType.DISABLE_PROXY;
        return this.sendMessage(type, { force });
    }

    public async addUrlToExclusions(
        profileId: string,
        url: string,
    ): Promise<ExtractMessageResponse<MessageType.ADD_URL_TO_EXCLUSIONS>> {
        const type = MessageType.ADD_URL_TO_EXCLUSIONS;
        return this.sendMessage(type, { url, profileId });
    }

    public async removeExclusion(
        profileId: string,
        id: string,
    ): Promise<ExtractMessageResponse<MessageType.REMOVE_EXCLUSION>> {
        const type = MessageType.REMOVE_EXCLUSION;
        return this.sendMessage(type, { id, profileId });
    }

    public async disableVpnByUrl(
        url: string,
    ): Promise<ExtractMessageResponse<MessageType.DISABLE_VPN_BY_URL>> {
        const type = MessageType.DISABLE_VPN_BY_URL;
        return this.sendMessage(type, { url });
    }

    public async enableVpnByUrl(
        url: string,
    ): Promise<ExtractMessageResponse<MessageType.ENABLE_VPN_BY_URL>> {
        const type = MessageType.ENABLE_VPN_BY_URL;
        return this.sendMessage(type, { url });
    }

    public async toggleExclusionState(
        profileId: string,
        id: string,
    ): Promise<ExtractMessageResponse<MessageType.TOGGLE_EXCLUSION_STATE>> {
        const type = MessageType.TOGGLE_EXCLUSION_STATE;
        return this.sendMessage(type, { id, profileId });
    }

    public async restoreExclusions(
        profileId: string,
    ): Promise<ExtractMessageResponse<MessageType.RESTORE_EXCLUSIONS>> {
        const type = MessageType.RESTORE_EXCLUSIONS;
        return this.sendMessage(type, { profileId });
    }

    public async toggleServices(
        profileId: string,
        ids: string[],
    ): Promise<ExtractMessageResponse<MessageType.TOGGLE_SERVICES>> {
        const type = MessageType.TOGGLE_SERVICES;
        return this.sendMessage(type, { ids, profileId });
    }

    public async resetServiceData(
        profileId: string,
        serviceId: string,
    ): Promise<ExtractMessageResponse<MessageType.RESET_SERVICE_DATA>> {
        const type = MessageType.RESET_SERVICE_DATA;
        return this.sendMessage(type, { serviceId, profileId });
    }

    public async clearExclusionsList(profileId: string):
    Promise<ExtractMessageResponse<MessageType.CLEAR_EXCLUSIONS_LIST>> {
        const type = MessageType.CLEAR_EXCLUSIONS_LIST;
        return this.sendMessage(type, { profileId });
    }

    public async disableOtherExtensions():
    Promise<ExtractMessageResponse<MessageType.DISABLE_OTHER_EXTENSIONS>> {
        const type = MessageType.DISABLE_OTHER_EXTENSIONS;
        return this.sendMessage(type);
    }

    public async isAuthenticated(): Promise<ExtractMessageResponse<MessageType.IS_AUTHENTICATED>> {
        const type = MessageType.IS_AUTHENTICATED;
        return this.sendMessage(type);
    }

    public async clearPermissionsError(): Promise<ExtractMessageResponse<MessageType.CLEAR_PERMISSIONS_ERROR>> {
        const type = MessageType.CLEAR_PERMISSIONS_ERROR;
        return this.sendMessage(type);
    }

    public async checkPermissions(): Promise<ExtractMessageResponse<MessageType.CHECK_PERMISSIONS>> {
        const type = MessageType.CHECK_PERMISSIONS;
        return this.sendMessage(type);
    }

    public async getExclusionsInverted(profileId: string):
    Promise<ExtractMessageResponse<MessageType.GET_EXCLUSIONS_INVERTED>> {
        const type = MessageType.GET_EXCLUSIONS_INVERTED;
        return this.sendMessage(type, { profileId });
    }

    public async getSetting(settingId: string): Promise<ExtractMessageResponse<MessageType.GET_SETTING_VALUE>> {
        const type = MessageType.GET_SETTING_VALUE;
        return this.sendMessage(type, { settingId });
    }

    public async setSetting(
        settingId: string,
        value: boolean | string,
    ): Promise<ExtractMessageResponse<MessageType.SET_SETTING_VALUE>> {
        const type = MessageType.SET_SETTING_VALUE;
        return this.sendMessage(type, { settingId, value });
    }

    public async getUsername(): Promise<ExtractMessageResponse<MessageType.GET_USERNAME>> {
        const type = MessageType.GET_USERNAME;
        return this.sendMessage(type);
    }

    /**
     * Updates user decision on marketing consent.
     *
     * @param newMarketingConsent New marketing consent value.
     */
    public async updateMarketingConsent(
        newMarketingConsent: boolean,
    ): Promise<ExtractMessageResponse<MessageType.UPDATE_MARKETING_CONSENT>> {
        const type = MessageType.UPDATE_MARKETING_CONSENT;
        return this.sendMessage(type, { newMarketingConsent });
    }

    public async getExclusionsData(
        profileId: string,
    ): Promise<ExtractMessageResponse<MessageType.GET_EXCLUSIONS_DATA>> {
        const type = MessageType.GET_EXCLUSIONS_DATA;
        return this.sendMessage(type, { profileId });
    }

    public async setExclusionsMode(
        profileId: string,
        mode: ExclusionsMode,
    ): Promise<ExtractMessageResponse<MessageType.SET_EXCLUSIONS_MODE>> {
        const type = MessageType.SET_EXCLUSIONS_MODE;
        return this.sendMessage(type, { mode, profileId });
    }

    public async getSelectedLocation(): Promise<ExtractMessageResponse<MessageType.GET_SELECTED_LOCATION>> {
        const type = MessageType.GET_SELECTED_LOCATION;
        return this.sendMessage(type);
    }

    public async checkIsPremiumToken():
    Promise<ExtractMessageResponse<MessageType.CHECK_IS_PREMIUM_TOKEN>> {
        const type = MessageType.CHECK_IS_PREMIUM_TOKEN;
        return this.sendMessage(type);
    }

    public async hideRateModalAfterCancel():
    Promise<ExtractMessageResponse<MessageType.HIDE_RATE_MODAL_AFTER_CANCEL>> {
        const type = MessageType.HIDE_RATE_MODAL_AFTER_CANCEL;
        return this.sendMessage(type);
    }

    public async hideRateModalAfterRate():
    Promise<ExtractMessageResponse<MessageType.HIDE_RATE_MODAL_AFTER_RATE>> {
        const type = MessageType.HIDE_RATE_MODAL_AFTER_RATE;
        return this.sendMessage(type);
    }

    public async hideMobileEdgePromoBanner():
    Promise<ExtractMessageResponse<MessageType.HIDE_MOBILE_EDGE_PROMO_BANNER>> {
        const type = MessageType.HIDE_MOBILE_EDGE_PROMO_BANNER;
        return this.sendMessage(type);
    }

    public async setNotificationViewed(
        withDelay: boolean,
    ): Promise<ExtractMessageResponse<MessageType.SET_NOTIFICATION_VIEWED>> {
        const type = MessageType.SET_NOTIFICATION_VIEWED;
        return this.sendMessage(type, { withDelay });
    }

    public async setHintPopupViewed(): Promise<ExtractMessageResponse<MessageType.SET_HINT_POPUP_VIEWED>> {
        const type = MessageType.SET_HINT_POPUP_VIEWED;
        return this.sendMessage(type);
    }

    public async markRegionNoticeAsShown():
    Promise<ExtractMessageResponse<MessageType.MARK_REGION_NOTICE_AS_SHOWN>> {
        const type = MessageType.MARK_REGION_NOTICE_AS_SHOWN;
        return this.sendMessage(type);
    }

    public async openTab(url: string): Promise<ExtractMessageResponse<MessageType.OPEN_TAB>> {
        const type = MessageType.OPEN_TAB;
        return this.sendMessage(type, { url });
    }

    public async reportBug(
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
    public async openPremiumPromoPage():
    Promise<ExtractMessageResponse<MessageType.OPEN_FORWARDER_URL_WITH_EMAIL>> {
        return this.openForwarderUrlWithEmail(ForwarderUrlQueryKey.UpgradeLicense);
    }

    /**
     * Opens Subscribe Promo Page in new tab.
     * @returns Promise that resolves when Subscribe Promo Page is opened.
     */
    public async openSubscribePromoPage():
    Promise<ExtractMessageResponse<MessageType.OPEN_FORWARDER_URL_WITH_EMAIL>> {
        return this.openForwarderUrlWithEmail(ForwarderUrlQueryKey.Subscribe);
    }

    /**
     * Opens Promote Socials Page in new tab.
     * @returns Promise that resolves when Promote Socials Page is opened.
     */
    public async openPromoteSocialsPage():
    Promise<ExtractMessageResponse<MessageType.OPEN_FORWARDER_URL_WITH_EMAIL>> {
        return this.openForwarderUrlWithEmail(ForwarderUrlQueryKey.PromoteSocials);
    }

    /**
     * Opens forwarder URL in new tab by appending email query param if user is logged in.
     *
     * @param forwarderUrlQueryKey Forwarder query key.
     *
     * @returns Promise that resolves when forwarder URL is opened.
     */
    public async openForwarderUrlWithEmail(
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
    public async setFlag(key: string, value: boolean): Promise<ExtractMessageResponse<MessageType.SET_FLAG>> {
        const type = MessageType.SET_FLAG;
        return this.sendMessage(type, { key, value });
    }

    public getGeneralExclusions(profileId: string):
    Promise<ExtractMessageResponse<MessageType.GET_GENERAL_EXCLUSIONS>> {
        const type = MessageType.GET_GENERAL_EXCLUSIONS;
        return this.sendMessage(type, { profileId });
    }

    public getSelectiveExclusions(profileId: string):
    Promise<ExtractMessageResponse<MessageType.GET_SELECTIVE_EXCLUSIONS>> {
        const type = MessageType.GET_SELECTIVE_EXCLUSIONS;
        return this.sendMessage(type, { profileId });
    }

    public addRegularExclusions(
        profileId: string,
        exclusions: string[],
    ): Promise<ExtractMessageResponse<MessageType.ADD_REGULAR_EXCLUSIONS>> {
        const type = MessageType.ADD_REGULAR_EXCLUSIONS;
        return this.sendMessage(type, { exclusions, profileId });
    }

    public addSelectiveExclusions(
        profileId: string,
        exclusions: string[],
    ): Promise<ExtractMessageResponse<MessageType.ADD_SELECTIVE_EXCLUSIONS>> {
        const type = MessageType.ADD_SELECTIVE_EXCLUSIONS;
        return this.sendMessage(type, { exclusions, profileId });
    }

    public addExclusionsMap(
        profileId: string,
        exclusionsMap: ExclusionsMap,
    ): Promise<ExtractMessageResponse<MessageType.ADD_EXCLUSIONS_MAP>> {
        const type = MessageType.ADD_EXCLUSIONS_MAP;
        return this.sendMessage(type, { exclusionsMap, profileId });
    }

    /**
     * Selects a DNS server for the given profile.
     *
     * @param profileId Profile ID.
     * @param dnsServerId DNS server ID to select.
     */
    public async setDnsServer(
        profileId: string,
        dnsServerId: string,
    ): Promise<void> {
        const type = MessageType.SET_DNS_SERVER;
        return this.sendMessage(type, { profileId, dnsServerId });
    }

    /**
     * Adds a custom DNS server to the given profile.
     *
     * @param profileId Profile ID.
     * @param dnsServerData Custom DNS server data.
     */
    public async addCustomDnsServer(
        profileId: string,
        dnsServerData: DnsServerData,
    ): Promise<void> {
        const type = MessageType.ADD_CUSTOM_DNS_SERVER;
        return this.sendMessage(type, { profileId, dnsServerData });
    }

    /**
     * Edits a custom DNS server in the given profile.
     *
     * @param profileId Profile ID.
     * @param dnsServerData Updated DNS server data.
     * @returns Updated custom DNS servers list.
     */
    public async editCustomDnsServer(
        profileId: string,
        dnsServerData: DnsServerData,
    ): Promise<ExtractMessageResponse<MessageType.EDIT_CUSTOM_DNS_SERVER>> {
        const type = MessageType.EDIT_CUSTOM_DNS_SERVER;
        return this.sendMessage(type, { profileId, dnsServerData });
    }

    /**
     * Removes a custom DNS server from the given profile.
     *
     * @param profileId Profile ID.
     * @param dnsServerId DNS server ID to remove.
     */
    public async removeCustomDnsServer(
        profileId: string,
        dnsServerId: string,
    ): Promise<void> {
        const type = MessageType.REMOVE_CUSTOM_DNS_SERVER;
        return this.sendMessage(type, { profileId, dnsServerId });
    }

    /**
     * Restores previously removed custom DNS servers from backup.
     *
     * @param profileId Profile ID.
     * @returns Restored custom DNS servers list.
     */
    public async restoreCustomDnsServersData(
        profileId: string,
    ): Promise<ExtractMessageResponse<MessageType.RESTORE_CUSTOM_DNS_SERVERS_DATA>> {
        const type = MessageType.RESTORE_CUSTOM_DNS_SERVERS_DATA;
        return this.sendMessage(type, { profileId });
    }

    /**
     * Gets logs from the background page.
     *
     * @returns Logs from the background page.
     */
    public getLogs(): Promise<ExtractMessageResponse<MessageType.GET_LOGS>> {
        const type = MessageType.GET_LOGS;
        return this.sendMessage(type);
    }

    /**
     * Gets app version from background page.
     *
     * @returns App version from background page.
     */
    public getAppVersion(): Promise<ExtractMessageResponse<MessageType.GET_APP_VERSION>> {
        const type = MessageType.GET_APP_VERSION;
        return this.sendMessage(type);
    }

    /**
     * Re-fetches locations from the server, refreshing backend-provided pings.
     *
     * @returns Promise that resolves when locations are refreshed.
     */
    public refreshLocations(): Promise<ExtractMessageResponse<MessageType.REFRESH_LOCATIONS>> {
        const type = MessageType.REFRESH_LOCATIONS;
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
    public async sendPageViewTelemetryEvent(
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
    public async sendCustomTelemetryEvent<T extends TelemetryActionName>(
        actionName: T,
        screenName: TelemetryActionToScreenMap[T],
        label?: string,
    ): Promise<ExtractMessageResponse<MessageType.TELEMETRY_EVENT_SEND_CUSTOM>> {
        const type = MessageType.TELEMETRY_EVENT_SEND_CUSTOM;
        return this.sendMessage(type, {
            actionName,
            screenName,
            label,
        });
    }

    /**
     * Removes opened page from the list of opened pages of telemetry module.
     *
     * @param pageId ID of page to remove.
     *
     * @returns Promise that resolves when opened page is removed.
     */
    public async removeTelemetryOpenedPage(
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
    public async getStatsByRange(
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
    public async clearStatistics(): Promise<ExtractMessageResponse<MessageType.STATISTICS_CLEAR>> {
        const type = MessageType.STATISTICS_CLEAR;
        return this.sendMessage(type);
    }

    /**
     * Sets the statistics disabled state.
     *
     * @param isDisabled If `true`, statistics will be disabled and no data will be collected.
     * @returns Promise that resolves when statistics disabled state is set.
     */
    public async setStatisticsIsDisabled(
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
    public async sendWebAuthAction(
        action: WebAuthAction,
    ): Promise<ExtractMessageResponse<MessageType.SEND_WEB_AUTH_ACTION>> {
        const type = MessageType.SEND_WEB_AUTH_ACTION;
        return this.sendMessage(type, { action });
    }

    /**
     * Gets startup data from the background page.
     *
     * @returns Promise with all required data for onboarding and upgrade screen.
     */
    public async getStartupData(): Promise<ExtractMessageResponse<MessageType.GET_STARTUP_DATA>> {
        const type = MessageType.GET_STARTUP_DATA;
        return this.sendMessage(type);
    }

    /**
     * Sets the interface language preference.
     *
     * @param language Locale code (e.g. 'de') or 'auto' for browser default.
     */
    public async setInterfaceLanguage(
        language: ExtractMessageData<MessageType.SET_INTERFACE_LANGUAGE>['language'],
    ): Promise<ExtractMessageResponse<MessageType.SET_INTERFACE_LANGUAGE>> {
        const type = MessageType.SET_INTERFACE_LANGUAGE;
        return this.sendMessage(type, { language });
    }

    /**
     * Retrieves the current interface language preference.
     *
     * @returns The current locale code or 'auto'.
     */
    private async getInterfaceLanguage(): Promise<ExtractMessageResponse<MessageType.GET_INTERFACE_LANGUAGE>> {
        const type = MessageType.GET_INTERFACE_LANGUAGE;
        return this.sendMessage(type);
    }

    /**
     * Fetches profiles data from the background script.
     *
     * @returns Profiles state including all profiles and active profile ID.
     */
    public async getProfilesData(): Promise<ExtractMessageResponse<MessageType.GET_PROFILES_DATA>> {
        const type = MessageType.GET_PROFILES_DATA;
        return this.sendMessage(type);
    }

    /**
     * Creates a new profile with the given name.
     *
     * @param name Display name for the new profile.
     * @returns Operation result with validation code and profile ID on success.
     */
    public async createProfile(name: string): Promise<ExtractMessageResponse<MessageType.CREATE_PROFILE>> {
        const type = MessageType.CREATE_PROFILE;
        return this.sendMessage(type, { name });
    }

    /**
     * Renames a profile.
     *
     * @param profileId Profile ID.
     * @param newName New display name.
     * @returns Operation result with validation code.
     */
    public async renameProfile(
        profileId: string,
        newName: string,
    ): Promise<ExtractMessageResponse<MessageType.RENAME_PROFILE>> {
        const type = MessageType.RENAME_PROFILE;
        return this.sendMessage(type, { profileId, newName });
    }

    /**
     * Deletes a profile.
     *
     * @param profileId Profile ID to delete.
     */
    public async deleteProfile(profileId: string): Promise<void> {
        const type = MessageType.DELETE_PROFILE;
        return this.sendMessage(type, { profileId });
    }

    /**
     * Switches the active profile and applies all managed settings.
     *
     * @param profileId Target profile ID.
     */
    public async switchProfile(profileId: string): Promise<void> {
        const type = MessageType.SWITCH_PROFILE;
        return this.sendMessage(type, { profileId });
    }

    /**
     * Sets the WebRTC protection setting for a profile.
     *
     * @param profileId Profile ID.
     * @param enabled Whether WebRTC protection should be enabled.
     */
    public async setProfileWebRtc(
        profileId: string,
        enabled: boolean,
    ): Promise<void> {
        const type = MessageType.SET_PROFILE_WEBRTC;
        return this.sendMessage(type, { profileId, enabled });
    }

    /**
     * Sets the quick-connect strategy for a profile.
     *
     * @param profileId Profile ID.
     * @param quickConnect Quick-connect strategy value.
     */
    public async setProfileQuickConnect(
        profileId: string,
        quickConnect: QuickConnectSetting,
    ): Promise<void> {
        const type = MessageType.SET_PROFILE_QUICK_CONNECT;
        return this.sendMessage(type, { profileId, quickConnect });
    }
}

export const messenger = new Messenger();
