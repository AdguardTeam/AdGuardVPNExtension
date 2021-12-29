import browser, { Runtime } from 'webextension-polyfill';

import { MessageType, SETTINGS_IDS } from '../lib/constants';
import auth from './auth';
import popupData from './popupData';
import endpoints from './endpoints';
import actions from './actions';
import credentials from './credentials';
import authCache from './authentication/authCache';
import appStatus from './appStatus';
import { settings } from './settings';
import { exclusions } from './exclusions';
import management from './management';
import permissionsError from './permissionsChecker/permissionsError';
import permissionsChecker from './permissionsChecker';
import { log } from '../lib/logger';
import notifier from '../lib/notifier';
import { locationsService } from './endpoints/locationsService';
import { promoNotifications } from './promoNotifications';
import tabs from './tabs';
import { vpnProvider } from './providers/vpnProvider';
import { logStorage } from '../lib/log-storage';
import { setDesktopVpnEnabled } from './connectivity/connectivityService/connectivityFSM';
import { flagsStorage } from './flagsStorage';
import { ExclusionsData } from '../common/exclusionsConstants';
import { exclusionsManager } from './exclusions/exclusions/ExclusionsManager';

interface Message {
    type: MessageType,
    data: any
}

interface EventListeners {
    [index: string]: Runtime.MessageSender;
}

const eventListeners: EventListeners = {};

const getOptionsData = async () => {
    const appVersion = appStatus.version;
    const username = await credentials.getUsername();
    const nextBillDate = await credentials.nextBillDate();
    const isRateVisible = settings.getSetting(SETTINGS_IDS.RATE_SHOW);
    const isPremiumFeaturesShow = settings.getSetting(SETTINGS_IDS.PREMIUM_FEATURES_SHOW);
    const webRTCEnabled = settings.getSetting(SETTINGS_IDS.HANDLE_WEBRTC_ENABLED);
    const contextMenusEnabled = settings.getSetting(SETTINGS_IDS.CONTEXT_MENU_ENABLED);
    const helpUsImprove = settings.getSetting(SETTINGS_IDS.HELP_US_IMPROVE);
    const dnsServer = settings.getSetting(SETTINGS_IDS.SELECTED_DNS_SERVER);
    const appearanceTheme = settings.getSetting(SETTINGS_IDS.APPEARANCE_THEME);

    const exclusionsData: ExclusionsData = {
        exclusions: exclusions.getExclusions(),
        currentMode: exclusions.getMode(),
    };

    const servicesData = exclusions.getServices();

    const isAuthenticated = await auth.isAuthenticated();
    // AG-644 set current endpoint in order to avoid bug in permissions checker
    await endpoints.getSelectedLocation();

    return {
        appVersion,
        username,
        nextBillDate,
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
    };
};

const messagesHandler = async (message: Message, sender: Runtime.MessageSender) => {
    const { type, data } = message;

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
                    } catch (e: any) {
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

            const { queryString } = message.data;
            return auth.authenticateSocial(queryString, id);
        }
        case MessageType.GET_POPUP_DATA: {
            const { url, numberOfTries } = data;
            return popupData.getPopupDataRetry(url, numberOfTries);
        }
        case MessageType.GET_OPTIONS_DATA: {
            return getOptionsData();
        }
        case MessageType.GET_VPN_FAILURE_PAGE: {
            return endpoints.getVpnFailurePage();
        }
        case MessageType.OPEN_OPTIONS_PAGE: {
            return actions.openOptionsPage();
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
            } catch (e: any) {
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
        case MessageType.IS_VPN_ENABLED_BY_URL: {
            const { url } = data;
            return exclusionsManager.isVpnEnabledByUrl(url);
        }
        case MessageType.REMOVE_EXCLUSION: {
            const { id } = data;
            return exclusions.removeExclusion(id);
        }
        case MessageType.TOGGLE_EXCLUSION_STATE: {
            const { id } = data;
            return exclusions.toggleExclusionState(id);
        }
        case MessageType.GET_PARENT_EXCLUSION: {
            const { id } = data;
            return exclusions.getParentExclusion(id);
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
            const { credentials } = data;
            return auth.register(credentials);
        }
        case MessageType.IS_AUTHENTICATED: {
            return auth.isAuthenticated();
        }
        case MessageType.START_SOCIAL_AUTH: {
            const { social, marketingConsent } = data;
            return auth.startSocialAuth(social, marketingConsent);
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
                exclusions: exclusions.getExclusions(),
                currentMode: exclusions.getMode(),
            } as ExclusionsData;
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

            const reportData: any = {
                appId,
                token,
                email,
                message,
                version,
            };

            if (includeLog) {
                reportData.appLogs = logStorage.toString();
            }

            return vpnProvider.requestSupport(reportData);
        }
        case MessageType.SET_DESKTOP_VPN_ENABLED: {
            const { status } = data;
            setDesktopVpnEnabled(status);
            break;
        }
        case MessageType.OPEN_PREMIUM_PROMO_PAGE: {
            return actions.openPremiumPromoPage();
        }
        case MessageType.SET_FLAG: {
            const { key, value } = data;
            return flagsStorage.set(key, value);
        }
        case MessageType.GET_GENERAL_EXCLUSIONS: {
            return exclusions.getRegularExclusions();
        }
        case MessageType.GET_SELECTIVE_EXCLUSIONS: {
            return exclusions.getSelectiveExclusions();
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
    port.onMessage.addListener((message) => {
        const { type, data } = message;
        if (type === MessageType.ADD_LONG_LIVED_CONNECTION) {
            const { events } = data;
            listenerId = notifier.addSpecifiedListener(events, async (...data) => {
                const type = MessageType.NOTIFY_LISTENERS;
                try {
                    port.postMessage({ type, data });
                } catch (e: any) {
                    log.error(e.message);
                }
            });
        }
    });

    port.onDisconnect.addListener(() => {
        log.debug(`Removing listener: ${listenerId} for port ${port.name}`);
        notifier.removeListener(listenerId);
    });
};

const init = () => {
    browser.runtime.onMessage.addListener(messagesHandler);
    browser.runtime.onConnect.addListener(longLivedMessageHandler);
};

export default {
    init,
};
