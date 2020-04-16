import browser from 'webextension-polyfill';
import { MESSAGES_TYPES } from '../lib/constants';
import auth from './auth';
import popupData from './popupData';
import endpoints from './endpoints';
import actions from './actions';
import proxy from './proxy';
import credentials from './credentials';
import authCache from './authentication/authCache';
import connectivity from './connectivity';
import appStatus from './appStatus';
import settings from './settings/settings';
import exclusions from './exclusions';
import management from './management';
import permissionsError from './permissionsChecker/permissionsError';
import permissionsChecker from './permissionsChecker';

const messageHandler = async (message, sender) => {
    const { type, data } = message;
    switch (type) {
        case MESSAGES_TYPES.AUTHENTICATE_SOCIAL: {
            const { tab: { id } } = sender;
            const { queryString } = message;
            return auth.authenticateSocial(queryString, id);
        }
        case MESSAGES_TYPES.GET_POPUP_DATA: {
            const { url, numberOfTries } = data;
            // TODO replace getPopupDataRetryWithCancel to getPopupDataRetry
            return popupData.getPopupDataRetryWithCancel(url, numberOfTries);
        }
        case MESSAGES_TYPES.GET_VPN_FAILURE_PAGE: {
            return endpoints.getVpnFailurePage();
        }
        case MESSAGES_TYPES.OPEN_OPTIONS_PAGE: {
            return actions.openOptionsPage();
        }
        case MESSAGES_TYPES.SET_CURRENT_ENDPOINT: {
            const { endpoint } = data;
            return proxy.setCurrentEndpoint(endpoint);
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
        case MESSAGES_TYPES.GET_CURRENT_ENDPOINT_PING: {
            return connectivity.endpointConnectivity.getPing();
        }
        case MESSAGES_TYPES.GET_CAN_CONTROL_PROXY: {
            return appStatus.canControlProxy();
        }
        case MESSAGES_TYPES.ENABLE_PROXY: {
            const { force, withCancel } = data;
            return settings.enableProxy(force, withCancel);
        }
        case MESSAGES_TYPES.DISABLE_PROXY: {
            const { force, withCancel } = data;
            return settings.disableProxy(force, withCancel);
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
            const { social } = data;
            return auth.startSocialAuth(social);
        }
        case MESSAGES_TYPES.CLEAR_PERMISSIONS_ERROR: {
            permissionsError.clearError();
            break;
        }
        case MESSAGES_TYPES.CHECK_PERMISSIONS: {
            await permissionsChecker.checkPermissions();
            break;
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
        default:
            throw new Error(`Unknown message type received: ${type}`);
    }
    return Promise.resolve();
};

const init = () => {
    browser.runtime.onMessage.addListener(messageHandler);
};

export default {
    init,
};
