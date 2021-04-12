import qs from 'qs';
import { nanoid } from 'nanoid';

import authProvider from './providers/authProvider';
import browserApi from './browserApi';
import tabs from './tabs';
import proxy from './proxy';
import notifications from './notifications';
import {
    AUTH_ACCESS_TOKEN_KEY,
    AUTH_CLIENT_ID,
} from './config';
import { log } from '../lib/logger';
import notifier from '../lib/notifier';
import { translator } from '../common/translator';
import { fallbackApi } from './api/fallbackApi';
// eslint-disable-next-line import/no-cycle
import settings from './settings/settings';

class Auth {
    socialAuthState = null;

    accessTokenData = null;

    async authenticate(credentials) {
        // turn off proxy to be sure it is not enabled before authentication
        try {
            await proxy.turnOff();
        } catch (e) {
            log.error(e.message);
        }

        let accessToken;
        try {
            accessToken = await authProvider.getAccessToken(credentials);
        } catch (e) {
            return JSON.parse(e.message);
        }

        await this.setAccessToken(accessToken);

        return { status: 'ok' };
    }

    async isAuthenticated(turnOffProxy) {
        let accessToken;

        try {
            accessToken = await this.getAccessToken(turnOffProxy);
        } catch (e) {
            return false;
        }

        return accessToken;
    }

    async startSocialAuth(socialProvider) {
        // turn off proxy to be sure it is not enabled before authentication
        try {
            await proxy.turnOff();
        } catch (e) {
            log.error(e.message);
        }

        // Generates uniq state id, which will be checked on the auth end
        this.socialAuthState = nanoid();
        const authUrl = this.getImplicitAuthUrl(socialProvider);
        await tabs.openSocialAuthTab(authUrl);
    }

    getImplicitAuthUrl(socialProvider) {
        const params = {
            response_type: 'token',
            client_id: AUTH_CLIENT_ID,
            redirect_uri: `https://${fallbackApi.AUTH_REDIRECT_URI}`,
            scope: 'trust',
            state: this.socialAuthState,
        };

        switch (socialProvider) {
            case 'google': {
                params.social_provider = 'google';
                break;
            }
            case 'twitter': {
                params.social_provider = 'twitter';
                break;
            }
            case 'vk': {
                params.social_provider = 'vk';
                break;
            }
            case 'yandex': {
                params.social_provider = 'yandex';
                break;
            }
            case 'facebook': {
                params.social_provider = 'facebook';
                break;
            }
            case 'apple': {
                params.social_provider = 'apple';
                break;
            }
            default:
                throw new Error(`There is no such provider: "${socialProvider}"`);
        }

        return `https://${fallbackApi.AUTH_BASE_URL}?${qs.stringify(params)}`;
    }

    async authenticateSocial(queryString, tabId) {
        const data = qs.parse(queryString);
        const {
            access_token: accessToken,
            expires_in: expiresIn,
            token_type: tokenType,
            state,
        } = data;

        if (state && state === this.socialAuthState) {
            await this.setAccessToken({
                accessToken,
                expiresIn,
                tokenType,
            });
            await tabs.closeTab(tabId);
            this.socialAuthState = null;
        }

        // Notify options page, in order to update view
        notifier.notifyListeners(notifier.types.AUTHENTICATE_SOCIAL_SUCCESS);
        await notifications.create({ message: translator.getMessage('authentication_successful_social') });
    }

    async deauthenticate() {
        try {
            await this.removeAccessToken();
        } catch (e) {
            log.error('Unable to remove access token. Error: ', e.message);
        }

        // turn off connection
        await settings.disableProxy(true);
        // set proxy settings to default
        await proxy.resetSettings();
        notifier.notifyListeners(notifier.types.USER_DEAUTHENTICATED);
    }

    async register(credentials) {
        const locale = navigator.language;
        let accessToken;
        try {
            accessToken = await authProvider.register({
                ...credentials,
                locale,
                clientId: AUTH_CLIENT_ID,
            });
        } catch (e) {
            const { error, field } = JSON.parse(e.message);
            return { error, field };
        }

        if (accessToken) {
            await this.setAccessToken(accessToken);
            return { status: 'ok' };
        }

        return {
            error: translator.getMessage('global_error_message', {
                a: (chunks) => `<a href="mailto:support@adguard-vpn.com" target="_blank">${chunks}</a>`,
            }),
        };
    }

    /**
     * Checks if user had such email registered
     * @param {string} email
     * @param {string} appId
     * @returns {Promise<{canRegister: string}|{error: string}>}
     */
    async userLookup(email, appId) {
        let response;
        try {
            response = await authProvider.userLookup(email, appId);
        } catch (e) {
            log.error(e.message);
            return {
                error: translator.getMessage('global_error_message', {
                    a: (chunks) => `<a href="mailto:support@adguard-vpn.com" target="_blank">${chunks}</a>`,
                }),
            };
        }
        return response;
    }

    async setAccessToken(accessToken) {
        this.accessTokenData = accessToken;
        await browserApi.storage.set(AUTH_ACCESS_TOKEN_KEY, accessToken);
        notifier.notifyListeners(notifier.types.USER_AUTHENTICATED);
    }

    async removeAccessToken() {
        this.accessTokenData = null;
        await browserApi.storage.remove(AUTH_ACCESS_TOKEN_KEY);
    }

    /**
     * Returns access token
     * If no token is available turns off, except of when turnOffProxy flag is false
     * @param {boolean} [turnOffProxy=true] - if false do not turns off proxy
     * @returns {Promise<string>}
     */
    async getAccessToken(turnOffProxy = true) {
        if (this.accessTokenData && this.accessTokenData.accessToken) {
            return this.accessTokenData.accessToken;
        }

        // if no access token, than try to get it from storage
        const accessTokenData = await browserApi.storage.get(AUTH_ACCESS_TOKEN_KEY);
        if (accessTokenData && accessTokenData.accessToken) {
            this.accessTokenData = accessTokenData;
            return accessTokenData.accessToken;
        }

        // if no access token found
        // 1. turn off proxy just in case
        if (turnOffProxy) {
            try {
                await proxy.turnOff();
            } catch (e) {
                log.error(e.message);
            }
        }

        // 2. throw error
        throw new Error('No access token, user is not authenticated');
    }

    async init() {
        const accessTokenData = await browserApi.storage.get(AUTH_ACCESS_TOKEN_KEY);
        if (!accessTokenData || !accessTokenData.accessToken) {
            return;
        }
        this.accessTokenData = accessTokenData;
        notifier.notifyListeners(notifier.types.USER_AUTHENTICATED);
        log.info('Authentication module is ready');
    }
}

const auth = new Auth();

export default auth;
