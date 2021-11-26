import browser from 'webextension-polyfill';

import { MESSAGES_TYPES, SETTINGS_IDS } from '../lib/constants';
import auth from './auth';
import popupData from './popupData';
import endpoints from './endpoints';
import actions from './actions';
import credentials from './credentials';
import authCache from './authentication/authCache';
import appStatus from './appStatus';
import { settings } from './settings';
import exclusions, { servicesManager } from './exclusions';
import management from './management';
import permissionsError from './permissionsChecker/permissionsError';
import permissionsChecker from './permissionsChecker';
import { log } from '../lib/logger';
import notifier from '../lib/notifier';
import { locationsService } from './endpoints/locationsService';
import { promoNotifications } from './promoNotifications';
import tabs from './tabs';
import vpnProvider from './providers/vpnProvider';
import { logStorage } from '../lib/log-storage';
import { setDesktopVpnEnabled } from './connectivity/connectivityService/connectivityFSM';
import { flagsStorage } from './flagsStorage';

const eventListeners = {};

const getOptionsData = async () => {
    const appVersion = appStatus.version;
    const username = await credentials.getUsername();
    const isRateVisible = settings.getSetting(SETTINGS_IDS.RATE_SHOW);
    const webRTCEnabled = settings.getSetting(SETTINGS_IDS.HANDLE_WEBRTC_ENABLED);
    const contextMenusEnabled = settings.getSetting(SETTINGS_IDS.CONTEXT_MENU_ENABLED);
    const helpUsImprove = settings.getSetting(SETTINGS_IDS.HELP_US_IMPROVE);
    const dnsServer = settings.getSetting(SETTINGS_IDS.SELECTED_DNS_SERVER);
    const appearanceTheme = settings.getSetting(SETTINGS_IDS.APPEARANCE_THEME);

    const exclusionsData = {
        regular: exclusions.regular?.getExclusions(),
        selective: exclusions.selective?.getExclusions(),
        currentMode: exclusions.current?.mode,
    };

    const servicesData = servicesManager.getServicesData();

    const isAuthenticated = await auth.isAuthenticated();
    // AG-644 set current endpoint in order to avoid bug in permissions checker
    await endpoints.getSelectedLocation();

    return {
        appVersion,
        username,
        isRateVisible,
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

const messageHandler = async (message, sender) => {
    const { type, data } = message;

    // Here we keep track of event listeners added through notifier

    switch (type) {
        case MESSAGES_TYPES.ADD_EVENT_LISTENER: {
            const { events } = data;
            const listenerId = notifier.addSpecifiedListener(events, async (...data) => {
                const sender = eventListeners[listenerId];
                if (sender) {
                    const type = MESSAGES_TYPES.NOTIFY_LISTENERS;
                    try {
                        await browser.tabs.sendMessage(sender.tab.id, { type, data });
                    } catch (e) {
                        log.error(e.message);
                    }
                }
            });
            eventListeners[listenerId] = sender;
            return Promise.resolve(listenerId);
        }
        case MESSAGES_TYPES.REMOVE_EVENT_LISTENER: {
            const { listenerId } = data;
            notifier.removeListener(listenerId);
            delete eventListeners[listenerId];
            break;
        }
        case MESSAGES_TYPES.AUTHENTICATE_SOCIAL: {
            const { tab: { id } } = sender;
            const { queryString } = message;
            return auth.authenticateSocial(queryString, id);
        }
        case MESSAGES_TYPES.GET_POPUP_DATA: {
            const { url, numberOfTries } = data;
            return popupData.getPopupDataRetry(url, numberOfTries);
        }
        case MESSAGES_TYPES.GET_OPTIONS_DATA: {
            return getOptionsData();
        }
        case MESSAGES_TYPES.GET_VPN_FAILURE_PAGE: {
            return endpoints.getVpnFailurePage();
        }
        case MESSAGES_TYPES.OPEN_OPTIONS_PAGE: {
            return actions.openOptionsPage();
        }
        case MESSAGES_TYPES.SET_SELECTED_LOCATION: {
            const { location, isSelectedByUser } = data;
            await locationsService.setSelectedLocation(location.id, isSelectedByUser);
            break;
        }
        case MESSAGES_TYPES.DEAUTHENTICATE_USER: {
            await auth.deauthenticate();
            await credentials.persistVpnToken(null);
            break;
        }
        case MESSAGES_TYPES.AUTHENTICATE_USER: {
            const { credentials } = data;
            return auth.authenticate(credentials);
        }
        case MESSAGES_TYPES.UPDATE_AUTH_CACHE: {
            const { field, value } = data;
            authCache.updateCache(field, value);
            break;
        }
        case MESSAGES_TYPES.GET_AUTH_CACHE: {
            return authCache.getCache();
        }
        case MESSAGES_TYPES.CLEAR_AUTH_CACHE: {
            return authCache.clearCache();
        }
        case MESSAGES_TYPES.GET_CAN_CONTROL_PROXY: {
            return appStatus.canControlProxy();
        }
        case MESSAGES_TYPES.ENABLE_PROXY: {
            const { force } = data;
            return settings.enableProxy(force);
        }
        case MESSAGES_TYPES.DISABLE_PROXY: {
            const { force } = data;
            return settings.disableProxy(force);
        }
        case MESSAGES_TYPES.ADD_URL_TO_EXCLUSIONS: {
            const { url } = data;
            return exclusions.current.addUrlToExclusions(url);
        }
        case MESSAGES_TYPES.REMOVE_EXCLUSION: {
            const { id, exclusionType } = data;
            return exclusions.current.removeExclusion(id, exclusionType);
        }
        case MESSAGES_TYPES.TOGGLE_EXCLUSION_STATE: {
            const { id, exclusionType } = data;
            return exclusions.current.toggleExclusionState(id, exclusionType);
        }
        case MESSAGES_TYPES.ADD_SERVICE: {
            const { id } = data;
            return exclusions.current.addService(id);
        }
        case MESSAGES_TYPES.REMOVE_FROM_EXCLUSIONS: {
            const { url } = data;
            return exclusions.current.disableExclusionByUrl(url);
        }
        case MESSAGES_TYPES.GET_IS_EXCLUDED: {
            const { url } = data;
            return exclusions.current.isExcluded(url);
        }
        case MESSAGES_TYPES.TOGGLE_SUBDOMAIN_STATE_IN_EXCLUSIONS_GROUP: {
            const { exclusionsGroupId, subdomainId } = data;
            return exclusions.current
                .toggleSubdomainStateInExclusionsGroup(exclusionsGroupId, subdomainId);
        }
        case MESSAGES_TYPES.REMOVE_SUBDOMAIN_FROM_EXCLUSIONS_GROUP: {
            const { exclusionsGroupId, subdomainId } = data;
            return exclusions.current
                .removeSubdomainFromExclusionsGroup(exclusionsGroupId, subdomainId);
        }
        case MESSAGES_TYPES.ADD_SUBDOMAIN_TO_EXCLUSIONS_GROUP: {
            const { exclusionsGroupId, subdomain } = data;
            return exclusions.current
                .addSubdomainToExclusionsGroup(exclusionsGroupId, subdomain);
        }
        case MESSAGES_TYPES.REMOVE_EXCLUSIONS_GROUP_FROM_SERVICE: {
            const { serviceId, exclusionsGroupId } = data;
            return exclusions.current
                .removeExclusionsGroupFromService(serviceId, exclusionsGroupId);
        }
        case MESSAGES_TYPES.TOGGLE_EXCLUSIONS_GROUP_STATE_IN_SERVICE: {
            const { serviceId, exclusionsGroupId } = data;
            return exclusions.current
                .toggleExclusionsGroupStateInService(serviceId, exclusionsGroupId);
        }
        case MESSAGES_TYPES.REMOVE_SUBDOMAIN_FROM_EXCLUSIONS_GROUP_IN_SERVICE: {
            const { serviceId, exclusionsGroupId, subdomainId } = data;
            return exclusions.current.removeSubdomainFromExclusionsGroupInService(
                serviceId,
                exclusionsGroupId,
                subdomainId,
            );
        }
        case MESSAGES_TYPES.TOGGLE_SUBDOMAIN_IN_EXCLUSIONS_GROUP_IN_SERVICE: {
            const { serviceId, exclusionsGroupId, subdomainId } = data;
            return exclusions.current.toggleSubdomainStateInExclusionsGroupInService(
                serviceId,
                exclusionsGroupId,
                subdomainId,
            );
        }
        case MESSAGES_TYPES.ADD_SUBDOMAIN_TO_EXCLUSIONS_GROUP_IN_SERVICE: {
            const { serviceId, exclusionsGroupId, subdomainId } = data;
            return exclusions.current.addSubdomainToExclusionsGroupInService(
                serviceId,
                exclusionsGroupId,
                subdomainId,
            );
        }
        case MESSAGES_TYPES.RESET_SERVICE_DATA: {
            const { serviceId } = data;
            return exclusions.current.resetServiceData(serviceId);
        }
        case MESSAGES_TYPES.CLEAR_EXCLUSIONS_LIST: {
            return exclusions.current.clearExclusionsData();
        }
        case MESSAGES_TYPES.CHECK_EMAIL: {
            const { email } = data;
            const appId = await credentials.getAppId();
            return auth.userLookup(email, appId);
        }
        case MESSAGES_TYPES.DISABLE_OTHER_EXTENSIONS: {
            await management.turnOffProxyExtensions();
            break;
        }
        case MESSAGES_TYPES.REGISTER_USER: {
            const { credentials } = data;
            return auth.register(credentials);
        }
        case MESSAGES_TYPES.IS_AUTHENTICATED: {
            return auth.isAuthenticated();
        }
        case MESSAGES_TYPES.START_SOCIAL_AUTH: {
            const { social, marketingConsent } = data;
            return auth.startSocialAuth(social, marketingConsent);
        }
        case MESSAGES_TYPES.CLEAR_PERMISSIONS_ERROR: {
            permissionsError.clearError();
            break;
        }
        case MESSAGES_TYPES.CHECK_PERMISSIONS: {
            await permissionsChecker.checkPermissions();
            break;
        }
        case MESSAGES_TYPES.GET_EXCLUSIONS_DATA: {
            return {
                regular: exclusions.regular?.getExclusions(),
                selective: exclusions.selective?.getExclusions(),
                currentMode: exclusions.current?.mode,
            };
        }
        case MESSAGES_TYPES.SET_EXCLUSIONS_MODE: {
            const { mode } = data;
            await exclusions.setCurrentMode(mode);
            break;
        }
        case MESSAGES_TYPES.REMOVE_EXCLUSION_BY_MODE: {
            const { mode, id } = data;
            const handler = exclusions.getHandler(mode);
            await handler.removeFromExclusions(id);
            break;
        }
        case MESSAGES_TYPES.REMOVE_EXCLUSIONS_BY_MODE: {
            const { mode } = data;
            const handler = exclusions.getHandler(mode);
            await handler.removeExclusions();
            break;
        }
        case MESSAGES_TYPES.TOGGLE_EXCLUSION_BY_MODE: {
            const { mode, id } = data;
            const handler = exclusions.getHandler(mode);
            await handler.toggleExclusion(id);
            break;
        }
        case MESSAGES_TYPES.RENAME_EXCLUSION_BY_MODE: {
            const { mode, id, name } = data;
            const handler = exclusions.getHandler(mode);
            await handler.renameExclusion(id, name);
            break;
        }
        case MESSAGES_TYPES.ADD_EXCLUSION_BY_MODE: {
            const { mode, url, enabled } = data;
            const handler = exclusions.getHandler(mode);
            handler.addToExclusions(url, enabled);
            break;
        }
        case MESSAGES_TYPES.ADD_REGULAR_EXCLUSIONS: {
            return exclusions.addRegularExclusions(data.exclusions);
        }
        case MESSAGES_TYPES.ADD_SELECTIVE_EXCLUSIONS: {
            return exclusions.addSelectiveExclusions(data.exclusions);
        }
        case MESSAGES_TYPES.GET_SELECTED_LOCATION: {
            return endpoints.getSelectedLocation();
        }
        case MESSAGES_TYPES.GET_EXCLUSIONS_INVERTED: {
            return exclusions.isInverted();
        }
        case MESSAGES_TYPES.GET_SETTING_VALUE: {
            const { settingId } = data;
            return settings.getSetting(settingId);
        }
        case MESSAGES_TYPES.SET_SETTING_VALUE: {
            const { settingId, value } = data;
            return settings.setSetting(settingId, value);
        }
        case MESSAGES_TYPES.GET_USERNAME: {
            return credentials.getUsername();
        }
        case MESSAGES_TYPES.CHECK_IS_PREMIUM_TOKEN: {
            return credentials.isPremiumToken();
        }
        case MESSAGES_TYPES.SET_NOTIFICATION_VIEWED: {
            const { withDelay } = data;
            return promoNotifications.setNotificationViewed(withDelay);
        }
        case MESSAGES_TYPES.OPEN_TAB: {
            const { url } = data;
            return tabs.openTab(url);
        }
        case MESSAGES_TYPES.REPORT_BUG: {
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

            const reportData = {
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
        case MESSAGES_TYPES.SET_DESKTOP_VPN_ENABLED: {
            const { status } = data;
            setDesktopVpnEnabled(status);
            break;
        }
        case MESSAGES_TYPES.OPEN_PREMIUM_PROMO_PAGE: {
            return actions.openPremiumPromoPage();
        }
        case MESSAGES_TYPES.SET_FLAG: {
            const { key, value } = data;
            return flagsStorage.set(key, value);
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
const longLivedMessageHandler = (port) => {
    let listenerId;

    log.debug(`Connecting to the port "${port.name}"`);
    port.onMessage.addListener((message) => {
        const { type, data } = message;
        if (type === MESSAGES_TYPES.ADD_LONG_LIVED_CONNECTION) {
            const { events } = data;
            listenerId = notifier.addSpecifiedListener(events, async (...data) => {
                const type = MESSAGES_TYPES.NOTIFY_LISTENERS;
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
    });
};

const init = () => {
    browser.runtime.onMessage.addListener(messageHandler);
    browser.runtime.onConnect.addListener(longLivedMessageHandler);
};

export default {
    init,
};
