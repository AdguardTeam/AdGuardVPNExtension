import browser, { type Runtime } from 'webextension-polyfill';

import { MessageType, SETTINGS_IDS, CUSTOM_DNS_ANCHOR_NAME } from '../../common/constants';
import { type ProfileExclusionsDataMap, type ProfilesOptionsData } from '../../options/stores/ProfilesStore';
import { logStorage } from '../../common/log-storage';
import { log } from '../../common/logger';
import { notifier } from '../../common/notifier';
import { auth, webAuth } from '../auth';
import { popupData } from '../popupData';
import { endpoints } from '../endpoints';
import { actions } from '../actions';
import { credentials } from '../credentials';
import { authCache } from '../authentication';
import { appStatus } from '../appStatus';
import { forwarder } from '../forwarder';
import { settings } from '../settings';
import { exclusions } from '../exclusions';
import { management } from '../management';
import { permissionsError } from '../permissionsChecker/permissionsError';
import { permissionsChecker } from '../permissionsChecker';
import { locationsService } from '../endpoints/locationsService';
import { promoNotifications } from '../promoNotifications';
import { tabs } from '../../common/tabs';
import { type RequestSupportParameters, vpnProvider } from '../providers/vpnProvider';
import { accountProvider } from '../providers/accountProvider';
import { flagsStorage } from '../flagsStorage';
import { rateModal } from '../rateModal';
import { dns } from '../dns';
import { hintPopup } from '../hintPopup';
import { vpnBlockedNotice } from '../vpnBlockedNotice';
import { limitedOfferService } from '../limitedOfferService';
import { telemetry } from '../telemetry';
import { mobileEdgePromoService } from '../mobileEdgePromoService';
import { savedLocations } from '../savedLocations';
import { getConsentData, setConsentData } from '../consent';
import { isMessage } from '../../common/messenger';
import { statisticsService } from '../statistics';
import { profilesService } from '../profiles';
import { type OptionsData } from '../../options/stores/SettingsStore';
import { updateService } from '../updateService';
import { i18n } from '../../common/i18n';

interface EventListeners {
    [index: string]: Runtime.MessageSender;
}

const eventListeners: EventListeners = {};

/**
 * This function is used to get options data for the options page.
 *
 * @param isDataRefresh If `true`, skips new `pageId` generation.
 * Use this when you want to refresh the data without needing to
 * generate a new `pageId`.
 *
 * @returns Options data.
 */
const getOptionsData = async (isDataRefresh: boolean): Promise<OptionsData> => {
    const appVersion = appStatus.version;
    const username = await credentials.getUsername();
    const isRateVisible = settings.getSetting(SETTINGS_IDS.RATE_SHOW);
    const isPremiumFeaturesShow = settings.getSetting(SETTINGS_IDS.PREMIUM_FEATURES_SHOW);
    const contextMenusEnabled = settings.getSetting(SETTINGS_IDS.CONTEXT_MENU_ENABLED);
    const helpUsImprove = settings.getSetting(SETTINGS_IDS.HELP_US_IMPROVE);
    const dnsServer = settings.getSetting(SETTINGS_IDS.SELECTED_DNS_SERVER);
    const appearanceTheme = settings.getSetting(SETTINGS_IDS.APPEARANCE_THEME);
    const vpnInfo = await endpoints.getVpnInfo();
    const maxDevicesCount = vpnInfo?.maxDevicesCount;
    const customDnsServers = settings.getCustomDnsServers();
    const quickConnectSetting = settings.getQuickConnectSetting();
    const selectedLanguage = settings.getSelectedLanguage();

    const locations = await locationsService.getLocations();

    let pageId = null;
    if (!isDataRefresh) {
        pageId = telemetry.addOpenedPage();
    }

    const servicesData = await exclusions.getServices();
    if (servicesData.length === 0) {
        // services may not be up-to-date on very first option page opening in firefox
        // if their loading was blocked before due to default absence of host permissions (<all_urls>).
        // so if it happens, they should be updated forcedly
        await exclusions.forceUpdateServices();
    }

    const isAuthenticated = await auth.isAuthenticated();
    const isPremiumToken = await credentials.isPremiumToken();
    const subscriptionType = await credentials.getSubscriptionType();
    const subscriptionTimeExpiresIso = await credentials.getTimeExpiresIso();

    // AG-644 set current endpoint in order to avoid bug in permissions checker
    await endpoints.getSelectedLocation();

    const forwarderDomain = await forwarder.updateAndGetDomain();

    return {
        appVersion,
        username,
        forwarderDomain,
        isRateVisible,
        isPremiumFeaturesShow,
        contextMenusEnabled,
        helpUsImprove,
        dnsServer,
        appearanceTheme,
        isAuthenticated,
        isPremiumToken,
        maxDevicesCount,
        subscriptionType,
        subscriptionTimeExpiresIso,
        customDnsServers,
        quickConnectSetting,
        selectedLanguage,
        locations,
        pageId,
    };
};

/**
 * Builds profiles options data including profiles list and exclusions for all profiles.
 *
 * @returns Profiles options data.
 */
const getProfilesOptionsData = async (): Promise<ProfilesOptionsData> => {
    const { profiles, activeProfileId } = await profilesService.getProfilesData();

    const profileExclusionsEntries = await Promise.all(
        profiles.map(async ({ id }) => {
            const data = await exclusions.getExclusionsDataForProfile(id);
            return [id, data];
        }),
    );
    const profileExclusionsData: ProfileExclusionsDataMap = Object.fromEntries(profileExclusionsEntries);

    const {
        profileDnsData,
        profileLocationData,
        profileWebRtcData,
    } = await profilesService.getProfileSettingsMaps();

    return {
        profiles,
        activeProfileId,
        profileExclusionsData,
        profileDnsData,
        profileLocationData,
        profileWebRtcData,
    };
};

const messagesHandler = async (message: unknown, sender: Runtime.MessageSender): Promise<any> => {
    if (!isMessage(message)) {
        log.error('[vpn.messaging]: Invalid message received:', message);
        return null;
    }

    const { type } = message;

    // Here we keep track of event listeners added through notifier
    switch (type) {
        case MessageType.ADD_EVENT_LISTENER: {
            const { events } = message.data;
            const listenerId = notifier.addSpecifiedListener(events, async (...data) => {
                const sender = eventListeners[listenerId];
                if (sender) {
                    const type = MessageType.NOTIFY_LISTENERS;
                    try {
                        if (sender.tab?.id) {
                            await browser.tabs.sendMessage(sender.tab.id, { type, data });
                        }
                    } catch (e) {
                        log.error('[vpn.messaging]: ', e.message);
                    }
                }
            });
            eventListeners[listenerId] = sender;
            return Promise.resolve(listenerId);
        }
        case MessageType.REMOVE_EVENT_LISTENER: {
            const { listenerId } = message.data;
            notifier.removeListener(listenerId);
            delete eventListeners[listenerId];
            break;
        }
        case MessageType.GET_POPUP_DATA: {
            const { url, numberOfTries } = message.data;
            return popupData.getPopupDataRetry(url, numberOfTries);
        }
        case MessageType.GET_STARTUP_DATA: {
            return {
                isFirstRun: updateService.isFirstRun,
                flagsStorageData: await flagsStorage.getFlagsStorageData(),
                marketingConsent: await credentials.getMarketingConsent(),
                isPremiumToken: await credentials.isPremiumToken(),
                // Fetched early to translate the popup skeleton screen
                selectedLanguage: settings.getSelectedLanguage(),
            };
        }
        case MessageType.GET_LIMITED_OFFER_DATA: {
            return limitedOfferService.getLimitedOfferData();
        }
        case MessageType.FORCE_UPDATE_LOCATIONS: {
            const locations = await endpoints.getLocationsFromServer();
            // set selected location after the locations are updated
            await endpoints.getSelectedLocation();
            return locations;
        }
        case MessageType.SAVED_LOCATIONS_SAVE_TAB: {
            const { locationsTab } = message.data;
            return locationsService.saveLocationsTab(locationsTab);
        }
        case MessageType.SAVED_LOCATIONS_ADD: {
            const { locationId } = message.data;
            return savedLocations.addSavedLocation(locationId);
        }
        case MessageType.SAVED_LOCATIONS_REMOVE: {
            const { locationId } = message.data;
            return savedLocations.removeSavedLocation(locationId);
        }
        case MessageType.GET_OPTIONS_DATA: {
            const { isRefresh } = message.data;
            return getOptionsData(isRefresh);
        }
        case MessageType.GET_CONSENT_DATA: {
            return getConsentData();
        }
        case MessageType.SET_CONSENT_DATA: {
            const { policyAgreement, helpUsImprove } = message.data;
            return setConsentData(policyAgreement, helpUsImprove);
        }
        case MessageType.GET_VPN_FAILURE_PAGE: {
            return endpoints.getVpnFailurePage();
        }
        case MessageType.OPEN_OPTIONS_PAGE: {
            return actions.openOptionsPage();
        }
        case MessageType.OPEN_FREE_GBS_PAGE: {
            await actions.openFreeGbsPage();
            break;
        }
        case MessageType.GET_BONUSES_DATA: {
            const accessToken = await auth.getAccessToken();
            return accountProvider.getAvailableBonuses(accessToken);
        }
        case MessageType.SET_SELECTED_LOCATION: {
            const { location, isSelectedByUser } = message.data;
            await locationsService.setSelectedLocation(location.id, isSelectedByUser);
            break;
        }
        case MessageType.DEAUTHENTICATE_USER: {
            await auth.deauthenticate();
            await credentials.persistVpnToken(null);
            break;
        }
        case MessageType.UPDATE_AUTH_CACHE: {
            const { field, value } = message.data;
            authCache.updateCache(field, value);
            break;
        }
        case MessageType.GET_CAN_CONTROL_PROXY: {
            return appStatus.canControlProxy();
        }
        case MessageType.ENABLE_PROXY: {
            const { force } = message.data;
            return settings.enableProxy(force);
        }
        case MessageType.DISABLE_PROXY: {
            const { force } = message.data;
            return settings.disableProxy(force);
        }
        case MessageType.ADD_URL_TO_EXCLUSIONS: {
            const { url, profileId } = message.data;
            try {
                return await exclusions.addUrlToExclusions(url, profileId);
            } catch (e) {
                throw new Error(e.message);
            }
        }
        case MessageType.DISABLE_VPN_BY_URL: {
            const { url } = message.data;
            return exclusions.disableVpnByUrl(url);
        }
        case MessageType.ENABLE_VPN_BY_URL: {
            const { url } = message.data;
            return exclusions.enableVpnByUrl(url);
        }
        case MessageType.REMOVE_EXCLUSION: {
            const { id, profileId } = message.data;
            return exclusions.removeExclusion(id, profileId);
        }
        case MessageType.TOGGLE_EXCLUSION_STATE: {
            const { id, profileId } = message.data;
            return exclusions.toggleExclusionState(id, profileId);
        }
        case MessageType.TOGGLE_SERVICES: {
            const { ids, profileId } = message.data;
            return exclusions.toggleServices(ids, profileId);
        }
        case MessageType.RESET_SERVICE_DATA: {
            const { serviceId, profileId } = message.data;
            return exclusions.resetServiceData(serviceId, profileId);
        }
        case MessageType.CLEAR_EXCLUSIONS_LIST: {
            const { profileId } = message.data ?? {};
            return exclusions.clearExclusionsData(profileId);
        }
        case MessageType.DISABLE_OTHER_EXTENSIONS: {
            await management.turnOffProxyExtensions();
            break;
        }
        case MessageType.IS_AUTHENTICATED: {
            return auth.isAuthenticated();
        }
        case MessageType.CLEAR_PERMISSIONS_ERROR: {
            permissionsError.clearError();
            break;
        }
        case MessageType.CHECK_PERMISSIONS: {
            await permissionsChecker.checkPermissions();
            break;
        }
        case MessageType.GET_EXCLUSIONS_DATA: {
            const { profileId } = message.data ?? {};
            return exclusions.getExclusionsDataForProfile(profileId);
        }
        case MessageType.SET_EXCLUSIONS_MODE: {
            const { mode, profileId } = message.data;
            await exclusions.setMode(mode, false, profileId);
            break;
        }
        case MessageType.ADD_REGULAR_EXCLUSIONS: {
            const { exclusions: exclusionsList } = message.data;
            return exclusions.importExport.addGeneralExclusions(exclusionsList);
        }
        case MessageType.ADD_SELECTIVE_EXCLUSIONS: {
            const { exclusions: exclusionsList } = message.data;
            return exclusions.importExport.addSelectiveExclusions(exclusionsList);
        }
        case MessageType.ADD_EXCLUSIONS_MAP: {
            const { exclusionsMap } = message.data;
            return exclusions.importExport.addExclusionsMap(exclusionsMap);
        }
        case MessageType.GET_SELECTED_LOCATION: {
            return endpoints.getSelectedLocation();
        }
        case MessageType.GET_EXCLUSIONS_INVERTED: {
            const { profileId } = message.data ?? {};
            return exclusions.isInverted(profileId);
        }
        case MessageType.GET_SETTING_VALUE: {
            const { settingId } = message.data;
            return settings.getSetting(settingId);
        }
        case MessageType.SET_SETTING_VALUE: {
            const { settingId, value } = message.data;
            return settings.setSetting(settingId, value);
        }
        case MessageType.GET_USERNAME: {
            return credentials.getUsername();
        }
        case MessageType.UPDATE_MARKETING_CONSENT: {
            const { newMarketingConsent } = message.data;
            return credentials.updateUserMarketingConsent(newMarketingConsent);
        }
        case MessageType.CHECK_IS_PREMIUM_TOKEN: {
            return credentials.isPremiumToken();
        }
        case MessageType.SET_NOTIFICATION_VIEWED: {
            const { withDelay } = message.data;
            return promoNotifications.setNotificationViewed(withDelay);
        }
        case MessageType.OPEN_TAB: {
            const { url } = message.data;
            return tabs.openTab(url);
        }
        case MessageType.REPORT_BUG: {
            const { email, message: bugMessage, includeLog } = message.data;
            const appId = await credentials.getAppId();
            let token;
            try {
                const vpnToken = await credentials.gainVpnToken();
                token = vpnToken?.token;
            } catch (e) {
                log.error('[vpn.messaging]: Was unable to get token');
            }
            const { version } = appStatus;

            if (!token) {
                log.error('[vpn.messaging]: Was unable to get token');
                break;
            }

            const reportData: RequestSupportParameters = {
                appId,
                token,
                email,
                message: bugMessage,
                version,
            };

            if (includeLog) {
                reportData.appLogs = await logStorage.getLogsString();
            }

            return vpnProvider.requestSupport(reportData);
        }
        case MessageType.OPEN_FORWARDER_URL_WITH_EMAIL: {
            const { forwarderUrlQueryKey } = message.data;
            return actions.openForwarderUrlWithEmail(forwarderUrlQueryKey);
        }
        case MessageType.SET_FLAG: {
            const { key, value } = message.data;
            return flagsStorage.set(key, value);
        }
        case MessageType.HIDE_RATE_MODAL_AFTER_CANCEL: {
            await rateModal.hideAfterCancel();
            break;
        }
        case MessageType.HIDE_RATE_MODAL_AFTER_RATE: {
            await rateModal.hideAfterRate();
            break;
        }
        case MessageType.HIDE_MOBILE_EDGE_PROMO_BANNER: {
            await mobileEdgePromoService.hideBanner();
            break;
        }
        case MessageType.GET_GENERAL_EXCLUSIONS: {
            return exclusions.importExport.getRegularExclusions();
        }
        case MessageType.GET_SELECTIVE_EXCLUSIONS: {
            return exclusions.importExport.getSelectiveExclusions();
        }
        case MessageType.RESTORE_EXCLUSIONS: {
            const { profileId } = message.data ?? {};
            return exclusions.restoreExclusions(profileId);
        }
        case MessageType.ADD_CUSTOM_DNS_SERVER: {
            const { dnsServerData, profileId } = message.data;
            return dns.addCustomDnsServer(dnsServerData, profileId);
        }
        case MessageType.HANDLE_CUSTOM_DNS_LINK: {
            const { name, address } = message.data;
            if (!name || !address) {
                log.error('[vpn.messaging]: Invalid custom DNS link', { name, address });
                return null;
            }
            await actions.openOptionsPage(
                {
                    anchorName: CUSTOM_DNS_ANCHOR_NAME,
                    queryParams: {
                        name,
                        address,
                    },
                },
            );
            return null;
        }
        case MessageType.EDIT_CUSTOM_DNS_SERVER: {
            const { dnsServerData, profileId } = message.data;
            return dns.editCustomDnsServer(dnsServerData, profileId);
        }
        case MessageType.REMOVE_CUSTOM_DNS_SERVER: {
            const { dnsServerId, profileId } = message.data;
            return dns.removeCustomDnsServer(dnsServerId, profileId);
        }
        case MessageType.RESTORE_CUSTOM_DNS_SERVERS_DATA: {
            const { profileId } = message.data ?? {};
            return dns.restoreCustomDnsServersData(profileId);
        }
        case MessageType.GET_LOGS: {
            return logStorage.getLogsString();
        }
        case MessageType.GET_APP_VERSION: {
            return appStatus.version;
        }
        case MessageType.SET_HINT_POPUP_VIEWED: {
            await hintPopup.setViewed();
            break;
        }
        case MessageType.MARK_REGION_NOTICE_AS_SHOWN: {
            await vpnBlockedNotice.markAsShown();
            break;
        }
        case MessageType.REFRESH_LOCATIONS: {
            await endpoints.getLocationsFromServer();
            break;
        }
        case MessageType.TELEMETRY_EVENT_SEND_PAGE_VIEW: {
            const { screenName, pageId } = message.data;
            await telemetry.sendPageViewEventDebounced(screenName, pageId);
            break;
        }
        case MessageType.TELEMETRY_EVENT_SEND_CUSTOM: {
            const {
                actionName,
                screenName,
                label,
            } = message.data;
            await telemetry.sendCustomEventDebounced(actionName, screenName, label);
            break;
        }
        case MessageType.TELEMETRY_EVENT_REMOVE_OPENED_PAGE: {
            const { pageId } = message.data;
            telemetry.removeOpenedPage(pageId);
            break;
        }
        case MessageType.STATISTICS_GET_BY_RANGE: {
            const { range } = message.data;
            return statisticsService.getStatsByRange(range);
        }
        case MessageType.STATISTICS_CLEAR: {
            return statisticsService.clearStatistics();
        }
        case MessageType.STATISTICS_SET_IS_DISABLED: {
            const { isDisabled } = message.data;
            return statisticsService.setIsDisabled(isDisabled);
        }
        case MessageType.SEND_WEB_AUTH_ACTION: {
            const { action } = message.data;
            const appId = await credentials.getAppId();
            return webAuth.handleAction(appId, action);
        }
        case MessageType.SET_INTERFACE_LANGUAGE: {
            const { language } = message.data;
            await settings.setSetting(SETTINGS_IDS.SELECTED_LANGUAGE, language);
            await i18n.setLocalePreference(language);
            notifier.notifyListeners(notifier.types.LANGUAGE_CHANGED, language);
            // Refetch locations with the new language (fire-and-forget).
            endpoints.getLocationsFromServer().catch((e) => {
                log.error('[vpn.messaging]: Failed to refetch locations after language change:', e);
            });
            break;
        }
        case MessageType.GET_INTERFACE_LANGUAGE: {
            return settings.getSelectedLanguage();
        }
        case MessageType.GET_PROFILES_DATA: {
            return getProfilesOptionsData();
        }
        case MessageType.SET_PROFILE_SETTING: {
            const { profileId, patch } = message.data;
            await profilesService.updateProfileSettings(profileId, patch, async (merged) => {
                if (patch.handleWebRtcEnabled !== undefined) {
                    await settings.setSetting(
                        SETTINGS_IDS.HANDLE_WEBRTC_ENABLED,
                        merged.handleWebRtcEnabled,
                    );
                }
            });
            break;
        }
        default:
            throw new Error(`Unknown message type received: ${type}`);
    }
    return Promise.resolve();
};

/**
 * This handler used to subscribe for notifications from popup page
 * https://developer.chrome.com/extensions/messaging#connect
 * We can't use simple one-time connections, because they can intercept each other
 * Causing issues like AG-2074
 */
const longLivedMessageHandler = (port: Runtime.Port): void => {
    let listenerId: string;

    log.debug(`[vpn.messaging]: Connecting to the port "${port.name}"`);
    notifier.notifyListeners(notifier.types.PORT_CONNECTED, port.name);

    port.onMessage.addListener((message) => {
        if (!isMessage(message)) {
            log.error('[vpn.messaging]: Invalid message received:', message);
            return;
        }

        const { type } = message;
        if (type === MessageType.ADD_LONG_LIVED_CONNECTION) {
            const { events } = message.data;
            listenerId = notifier.addSpecifiedListener(events, async (...data) => {
                const type = MessageType.NOTIFY_LISTENERS;
                try {
                    port.postMessage({ type, data });
                } catch (e) {
                    log.error('[vpn.messaging]: ', e.message);
                }
            });
        }
    });

    port.onDisconnect.addListener(() => {
        log.debug(`[vpn.messaging]: Removing listener: ${listenerId} for port ${port.name}`);
        notifier.removeListener(listenerId);
        notifier.notifyListeners(notifier.types.PORT_DISCONNECTED, port.name);
    });
};

const init = (): void => {
    browser.runtime.onMessage.addListener(messagesHandler);
    browser.runtime.onConnect.addListener(longLivedMessageHandler);
};

export const messaging = {
    init,
};
