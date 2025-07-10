import browser, { type Runtime } from 'webextension-polyfill';

import { mainInitializationPromise } from '../index';
import { MessageType, SETTINGS_IDS, CUSTOM_DNS_ANCHOR_NAME } from '../../common/constants';
import { type ExclusionsData } from '../../common/exclusionsConstants';
import { logStorage } from '../../common/log-storage';
import { log } from '../../common/logger';
import { notifier } from '../../common/notifier';
import { auth } from '../auth';
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
import { tabs } from '../tabs';
import { type RequestSupportParameters, vpnProvider } from '../providers/vpnProvider';
import { accountProvider } from '../providers/accountProvider';
import { flagsStorage } from '../flagsStorage';
import { rateModal } from '../rateModal';
import { dns } from '../dns';
import { hintPopup } from '../hintPopup';
import { emailConfirmationService } from '../emailConfirmationService';
import { limitedOfferService } from '../limitedOfferService';
import { telemetry } from '../telemetry';
import { mobileEdgePromoService } from '../mobileEdgePromoService';
import { savedLocations } from '../savedLocations';
import { getConsentData, setConsentData } from '../consent';
import { isMessage } from '../../common/messenger';
import { statisticsService } from '../statistics';

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
const getOptionsData = async (isDataRefresh: boolean) => {
    const appVersion = appStatus.version;
    const username = await credentials.getUsername();
    const isRateVisible = settings.getSetting(SETTINGS_IDS.RATE_SHOW);
    const isPremiumFeaturesShow = settings.getSetting(SETTINGS_IDS.PREMIUM_FEATURES_SHOW);
    const webRTCEnabled = settings.getSetting(SETTINGS_IDS.HANDLE_WEBRTC_ENABLED);
    const contextMenusEnabled = settings.getSetting(SETTINGS_IDS.CONTEXT_MENU_ENABLED);
    const helpUsImprove = settings.getSetting(SETTINGS_IDS.HELP_US_IMPROVE);
    const dnsServer = settings.getSetting(SETTINGS_IDS.SELECTED_DNS_SERVER);
    const appearanceTheme = settings.getSetting(SETTINGS_IDS.APPEARANCE_THEME);
    const vpnInfo = await endpoints.getVpnInfo();
    const maxDevicesCount = vpnInfo?.maxDevicesCount;
    const customDnsServers = settings.getCustomDnsServers();
    const quickConnectSetting = settings.getQuickConnectSetting();

    let pageId = null;
    if (!isDataRefresh) {
        pageId = telemetry.addOpenedPage();
    }

    const exclusionsData: ExclusionsData = {
        exclusions: exclusions.getExclusions(),
        currentMode: exclusions.getMode(),
    };

    const isAllExclusionsListsEmpty = !(exclusions.getRegularExclusions().length
        || exclusions.getSelectiveExclusions().length);

    let servicesData = exclusions.getServices();
    if (servicesData.length === 0) {
        // services may not be up-to-date on very first option page opening in firefox
        // if their loading was blocked before due to default absence of host permissions (<all_urls>).
        // so if it happens, they should be updated forcedly
        await exclusions.forceUpdateServices();
        servicesData = exclusions.getServices();
    }

    const isAuthenticated = await auth.isAuthenticated();
    const isPremiumToken = await credentials.isPremiumToken();
    const subscriptionType = credentials.getSubscriptionType();
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
        webRTCEnabled,
        contextMenusEnabled,
        helpUsImprove,
        dnsServer,
        appearanceTheme,
        exclusionsData,
        servicesData,
        isAuthenticated,
        isPremiumToken,
        isAllExclusionsListsEmpty,
        maxDevicesCount,
        subscriptionType,
        subscriptionTimeExpiresIso,
        customDnsServers,
        quickConnectSetting,
        pageId,
    };
};

const messagesHandler = async (message: unknown, sender: Runtime.MessageSender) => {
    if (!isMessage(message)) {
        log.error('Invalid message received:', message);
        return null;
    }

    const { type, data } = message;

    /**
     * Before processing any message, we need to ensure that
     * all necessary modules are initialized and ready to use.
     *
     * Except for the `IS_AUTHENTICATED` message type, which is used to check
     * if the user is authenticated or not, which needs to be processed immediately
     * in order to avoid flashing different type of loaders in popup page.
     * Under the hood, `auth.isAuthenticated()` will wait for the dependant modules
     * to be initialized, so it can be safely processed immediately.
     */
    if (type !== MessageType.IS_AUTHENTICATED) {
        await mainInitializationPromise;
    }

    // Here we keep track of event listeners added through notifier

    switch (type) {
        case MessageType.ADD_EVENT_LISTENER: {
            const { events } = data;
            const listenerId = notifier.addSpecifiedListener(events, async (...data) => {
                const sender = eventListeners[listenerId];
                if (sender) {
                    const type = MessageType.NOTIFY_LISTENERS;
                    try {
                        if (sender.tab?.id) {
                            await browser.tabs.sendMessage(sender.tab.id, { type, data });
                        }
                    } catch (e) {
                        log.error(e.message);
                    }
                }
            });
            eventListeners[listenerId] = sender;
            return Promise.resolve(listenerId);
        }
        case MessageType.REMOVE_EVENT_LISTENER: {
            const { listenerId } = data;
            notifier.removeListener(listenerId);
            delete eventListeners[listenerId];
            break;
        }
        case MessageType.AUTHENTICATE_SOCIAL: {
            const id = sender?.tab?.id;
            if (!id) {
                return undefined;
            }

            return auth.authenticateSocial(message.data, id);
        }
        case MessageType.AUTHENTICATE_THANKYOU_PAGE: {
            const { token, redirectUrl, newUser } = message.data;
            return auth.authenticateThankYouPage({ token, redirectUrl, newUser });
        }
        case MessageType.GET_POPUP_DATA: {
            const { url, numberOfTries } = data;
            return popupData.getPopupDataRetry(url, numberOfTries);
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
            const { locationsTab } = data;
            return locationsService.saveLocationsTab(locationsTab);
        }
        case MessageType.SAVED_LOCATIONS_ADD: {
            const { locationId } = data;
            return savedLocations.addSavedLocation(locationId);
        }
        case MessageType.SAVED_LOCATIONS_REMOVE: {
            const { locationId } = data;
            return savedLocations.removeSavedLocation(locationId);
        }
        case MessageType.GET_OPTIONS_DATA: {
            const { isRefresh } = data;
            return getOptionsData(isRefresh);
        }
        case MessageType.GET_CONSENT_DATA: {
            return getConsentData();
        }
        case MessageType.SET_CONSENT_DATA: {
            const { policyAgreement, helpUsImprove } = data;
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
            const { location, isSelectedByUser } = data;
            await locationsService.setSelectedLocation(location.id, isSelectedByUser);
            break;
        }
        case MessageType.DEAUTHENTICATE_USER: {
            await auth.deauthenticate();
            await credentials.persistVpnToken(null);
            break;
        }
        case MessageType.AUTHENTICATE_USER: {
            const { credentials } = data;
            emailConfirmationService.restartCountdown(credentials.username);
            return auth.authenticate(credentials);
        }
        case MessageType.UPDATE_AUTH_CACHE: {
            const { field, value } = data;
            authCache.updateCache(field, value);
            break;
        }
        case MessageType.GET_AUTH_CACHE: {
            return authCache.getCache();
        }
        case MessageType.CLEAR_AUTH_CACHE: {
            return authCache.clearCache();
        }
        case MessageType.GET_CAN_CONTROL_PROXY: {
            return appStatus.canControlProxy();
        }
        case MessageType.ENABLE_PROXY: {
            const { force } = data;
            return settings.enableProxy(force);
        }
        case MessageType.DISABLE_PROXY: {
            const { force } = data;
            return settings.disableProxy(force);
        }
        case MessageType.ADD_URL_TO_EXCLUSIONS: {
            const { url } = data;
            try {
                return await exclusions.addUrlToExclusions(url);
            } catch (e) {
                throw new Error(e.message);
            }
        }
        case MessageType.DISABLE_VPN_BY_URL: {
            const { url } = data;
            return exclusions.disableVpnByUrl(url);
        }
        case MessageType.ENABLE_VPN_BY_URL: {
            const { url } = data;
            return exclusions.enableVpnByUrl(url);
        }
        case MessageType.REMOVE_EXCLUSION: {
            const { id } = data;
            return exclusions.removeExclusion(id);
        }
        case MessageType.TOGGLE_EXCLUSION_STATE: {
            const { id } = data;
            return exclusions.toggleExclusionState(id);
        }
        case MessageType.TOGGLE_SERVICES: {
            const { ids } = data;
            return exclusions.toggleServices(ids);
        }
        case MessageType.RESET_SERVICE_DATA: {
            const { serviceId } = data;
            return exclusions.resetServiceData(serviceId);
        }
        case MessageType.CLEAR_EXCLUSIONS_LIST: {
            return exclusions.clearExclusionsData();
        }
        case MessageType.CHECK_EMAIL: {
            const { email } = data;
            const appId = await credentials.getAppId();
            return auth.userLookup(email, appId);
        }
        case MessageType.DISABLE_OTHER_EXTENSIONS: {
            await management.turnOffProxyExtensions();
            break;
        }
        case MessageType.REGISTER_USER: {
            const appId = await credentials.getAppId();
            emailConfirmationService.restartCountdown(data.credentials.username);
            return auth.register({ ...data.credentials, appId });
        }
        case MessageType.IS_AUTHENTICATED: {
            return auth.isAuthenticated();
        }
        case MessageType.START_SOCIAL_AUTH: {
            const { provider, marketingConsent } = data;
            return auth.startSocialAuth(provider, marketingConsent);
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
            return {
                exclusionsData: {
                    exclusions: exclusions.getExclusions(),
                    currentMode: exclusions.getMode(),
                },
                services: exclusions.getServices(),
                isAllExclusionsListsEmpty: !(exclusions.getRegularExclusions().length
                    || exclusions.getSelectiveExclusions().length),
            };
        }
        case MessageType.SET_EXCLUSIONS_MODE: {
            const { mode } = data;
            await exclusions.setMode(mode);
            break;
        }
        case MessageType.ADD_REGULAR_EXCLUSIONS: {
            return exclusions.addGeneralExclusions(data.exclusions);
        }
        case MessageType.ADD_SELECTIVE_EXCLUSIONS: {
            return exclusions.addSelectiveExclusions(data.exclusions);
        }
        case MessageType.ADD_EXCLUSIONS_MAP: {
            return exclusions.addExclusionsMap(data.exclusionsMap);
        }
        case MessageType.GET_SELECTED_LOCATION: {
            return endpoints.getSelectedLocation();
        }
        case MessageType.GET_EXCLUSIONS_INVERTED: {
            return exclusions.isInverted();
        }
        case MessageType.GET_SETTING_VALUE: {
            const { settingId } = data;
            return settings.getSetting(settingId);
        }
        case MessageType.SET_SETTING_VALUE: {
            const { settingId, value } = data;
            return settings.setSetting(settingId, value);
        }
        case MessageType.GET_USERNAME: {
            return credentials.getUsername();
        }
        case MessageType.CHECK_IS_PREMIUM_TOKEN: {
            return credentials.isPremiumToken();
        }
        case MessageType.SET_NOTIFICATION_VIEWED: {
            const { withDelay } = data;
            return promoNotifications.setNotificationViewed(withDelay);
        }
        case MessageType.OPEN_TAB: {
            const { url } = data;
            return tabs.openTab(url);
        }
        case MessageType.REPORT_BUG: {
            const { email, message, includeLog } = data;
            const appId = await credentials.getAppId();
            let token;
            try {
                const vpnToken = await credentials.gainVpnToken();
                token = vpnToken?.token;
            } catch (e) {
                log.error('Was unable to get token');
            }
            const { version } = appStatus;

            if (!token) {
                log.error('Was unable to get token');
                break;
            }

            const reportData: RequestSupportParameters = {
                appId,
                token,
                email,
                message,
                version,
            };

            if (includeLog) {
                reportData.appLogs = await logStorage.getLogsString();
            }

            return vpnProvider.requestSupport(reportData);
        }
        case MessageType.OPEN_FORWARDER_URL_WITH_EMAIL: {
            const { forwarderUrlQueryKey } = data;
            return actions.openForwarderUrlWithEmail(forwarderUrlQueryKey);
        }
        case MessageType.SET_FLAG: {
            const { key, value } = data;
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
            return exclusions.getRegularExclusions();
        }
        case MessageType.GET_SELECTIVE_EXCLUSIONS: {
            return exclusions.getSelectiveExclusions();
        }
        case MessageType.RESTORE_EXCLUSIONS: {
            return exclusions.restoreExclusions();
        }
        case MessageType.ADD_CUSTOM_DNS_SERVER: {
            return dns.addCustomDnsServer(data.dnsServerData);
        }
        case MessageType.HANDLE_CUSTOM_DNS_LINK: {
            await actions.openOptionsPage(
                {
                    anchorName: CUSTOM_DNS_ANCHOR_NAME,
                    queryParams: {
                        name: data.name,
                        address: data.address,
                    },
                },
            );
            return null;
        }
        case MessageType.EDIT_CUSTOM_DNS_SERVER: {
            dns.editCustomDnsServer(data.dnsServerData);
            return settings.getCustomDnsServers();
        }
        case MessageType.REMOVE_CUSTOM_DNS_SERVER: {
            return dns.removeCustomDnsServer(data.dnsServerId);
        }
        case MessageType.RESEND_CONFIRM_REGISTRATION_LINK: {
            const { displayNotification } = data;
            const accessToken = await auth.getAccessToken();
            return accountProvider.resendConfirmRegistrationLink(accessToken, displayNotification);
        }
        case MessageType.SET_EMAIL_CONFIRMATION_AUTH_ID: {
            const { authId } = data;
            emailConfirmationService.setAuthId(authId);
            break;
        }
        case MessageType.RESEND_EMAIL_CONFIRMATION_CODE: {
            emailConfirmationService.restartCountdown();

            const { authId } = emailConfirmationService;
            if (!authId) {
                log.error('Value authId was not set in the emailConfirmationService');
                break;
            }

            await auth.resendEmailConfirmationCode(authId);
            break;
        }
        case MessageType.GET_RESEND_CODE_COUNTDOWN: {
            const countdown = await emailConfirmationService.getCodeCountdown();
            return countdown;
        }
        case MessageType.RESTORE_CUSTOM_DNS_SERVERS_DATA: {
            return dns.restoreCustomDnsServersData();
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
        case MessageType.RECALCULATE_PINGS: {
            locationsService.measurePings(true);
            break;
        }
        case MessageType.TELEMETRY_EVENT_SEND_PAGE_VIEW: {
            const { screenName, pageId } = data;
            await telemetry.sendPageViewEventDebounced(screenName, pageId);
            break;
        }
        case MessageType.TELEMETRY_EVENT_SEND_CUSTOM: {
            const { actionName, screenName } = data;
            await telemetry.sendCustomEventDebounced(actionName, screenName);
            break;
        }
        case MessageType.TELEMETRY_EVENT_REMOVE_OPENED_PAGE: {
            const { pageId } = data;
            telemetry.removeOpenedPage(pageId);
            break;
        }
        case MessageType.STATISTICS_GET_BY_RANGE: {
            const { range } = data;
            return statisticsService.getStatsByRange(range);
        }
        case MessageType.STATISTICS_CLEAR: {
            return statisticsService.clearStatistics();
        }
        case MessageType.STATISTICS_SET_IS_DISABLED: {
            const { isDisabled } = data;
            return statisticsService.setIsDisabled(isDisabled);
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
const longLivedMessageHandler = (port: Runtime.Port) => {
    let listenerId: string;

    log.debug(`Connecting to the port "${port.name}"`);
    notifier.notifyListeners(notifier.types.PORT_CONNECTED, port.name);

    port.onMessage.addListener((message) => {
        if (!isMessage(message)) {
            log.error('Invalid message received:', message);
            return;
        }

        const { type, data } = message;
        if (type === MessageType.ADD_LONG_LIVED_CONNECTION) {
            const { events } = data;
            listenerId = notifier.addSpecifiedListener(events, async (...data) => {
                const type = MessageType.NOTIFY_LISTENERS;
                try {
                    port.postMessage({ type, data });
                } catch (e) {
                    log.error(e.message);
                }
            });
        }
    });

    port.onDisconnect.addListener(() => {
        log.debug(`Removing listener: ${listenerId} for port ${port.name}`);
        notifier.removeListener(listenerId);
        notifier.notifyListeners(notifier.types.PORT_DISCONNECTED, port.name);
    });
};

const init = () => {
    browser.runtime.onMessage.addListener(messagesHandler);
    browser.runtime.onConnect.addListener(longLivedMessageHandler);
};

export const messaging = {
    init,
};
