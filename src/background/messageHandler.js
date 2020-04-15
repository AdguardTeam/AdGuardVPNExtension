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

const messagesHandler = async (message, sender) => {
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
        case MESSAGES_TYPES.GET_APP_ID: {
            return credentials.getAppId();
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
        default:
            throw new Error(`Unknown message type received: ${type}`);
    }
    return Promise.resolve();
};

const init = () => {
    browser.runtime.onMessage.addListener(messagesHandler);
};

export default {
    init,
};
