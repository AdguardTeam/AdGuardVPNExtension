import browser from 'webextension-polyfill';
import { MESSAGES_TYPES } from '../lib/constants';
import auth from './auth';
import popupData from './popupData';
import endpoints from './endpoints';
import actions from './actions';
import credentials from './credentials';
import authCache from './authentication/authCache';
import appStatus from './appStatus';
import { settings } from './settings';
import exclusions from './exclusions';
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

const eventListeners = {};

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
        case MESSAGES_TYPES.ADD_TO_EXCLUSIONS: {
            const { url, enabled, options } = data;
            return exclusions.current.addToExclusions(url, enabled, options);
        }
        case MESSAGES_TYPES.REMOVE_FROM_EXCLUSIONS: {
            const { url } = data;
            return exclusions.current.disableExclusionByUrl(url);
        }
        case MESSAGES_TYPES.GET_IS_EXCLUDED: {
            const { url } = data;
            return exclusions.current.isExcluded(url);
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
        case MESSAGES_TYPES.GET_EXCLUSIONS: {
            const regularExclusions = exclusions.regular.getExclusionsList();
            const selectiveExclusions = exclusions.selective.getExclusionsList();
            const exclusionsCurrentMode = exclusions.current.mode;

            return {
                regular: regularExclusions,
                selective: selectiveExclusions,
                currentMode: exclusionsCurrentMode,
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
        case MESSAGES_TYPES.GET_APP_VERSION: {
            return appStatus.version;
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
