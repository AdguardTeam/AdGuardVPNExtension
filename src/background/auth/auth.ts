import { log } from '../../common/logger';
import { notifier } from '../../common/notifier';
import { translator } from '../../common/translator';
import { tabs } from '../tabs';
import { proxy } from '../proxy';
import { notifications } from '../notifications';
// eslint-disable-next-line import/no-cycle
import { settings } from '../settings';
import { flagsStorage } from '../flagsStorage';
import { StorageKey, type AuthAccessToken, type AuthState } from '../schema';
import { authService } from '../authentication/authService';
import { stateStorage } from '../stateStorage';

import { type ThankYouPageData, thankYouPageSchema } from './thankYouPageSchema';

export interface AuthInterface {
    isAuthenticated(turnOffProxy?: boolean): Promise<boolean>;
    authenticateThankYouPage(rawData: unknown): Promise<void>;
    deauthenticate(): Promise<void>;
    getAccessToken(turnOffProxy?: boolean): Promise<string>;
    init(): Promise<void>;
}

class Auth implements AuthInterface {
    /**
     * Promise that resolves when the authentication state is initialized.
     */
    private initStatePromise: Promise<void> | null = null;

    /**
     * Current authentication state.
     */
    private state: AuthState;

    private saveAuthState = () => {
        stateStorage.setItem(StorageKey.AuthState, this.state);
    };

    private get accessTokenData(): AuthAccessToken | null {
        return this.state.accessTokenData;
    }

    private set accessTokenData(accessTokenData: AuthAccessToken | null) {
        this.state.accessTokenData = accessTokenData;
        this.saveAuthState();
    }

    /**
     * Checks if user is authenticated.
     *
     * @param turnOffProxy If true, turns off the proxy if no access token is found.
     *
     * @returns True if user is authenticated, false otherwise.
     */
    async isAuthenticated(turnOffProxy?: boolean): Promise<boolean> {
        /**
         * Wait for session storage after service worker awoken.
         * This is needed because this method might be called before
         * the extension is fully loaded between service worker restarts.
         */
        await this.initState();

        let accessToken;

        try {
            accessToken = await this.getAccessToken(turnOffProxy);
        } catch (e) {
            return false;
        }

        return !!accessToken;
    }

    /**
     * Authenticate user after registration on thank you page
     * @param rawData
     */
    async authenticateThankYouPage(
        rawData: unknown,
    ): Promise<void> {
        let data: ThankYouPageData;
        try {
            data = thankYouPageSchema.parse(rawData);
        } catch (e) {
            log.error(`Unable to authenticate user, invalid params received from the page: ${JSON.stringify(rawData)}`);
            return;
        }

        const {
            token,
            newUser,
            redirectUrl,
        } = data;

        const isAuthenticated = await this.isAuthenticated();
        if (isAuthenticated) {
            await tabs.redirectCurrentTab(redirectUrl);
            return;
        }

        const credentials: AuthAccessToken = {
            accessToken: token,
            expiresIn: 60 * 60 * 24 * 30, //  30 days in seconds
            tokenType: 'Bearer',
        };

        await this.setAccessToken(credentials);

        if (newUser) {
            await flagsStorage.onRegister();
        } else {
            await flagsStorage.onAuthenticate();
        }

        await notifications.create({ message: translator.getMessage('authentication_successful_notification') });
        await tabs.redirectCurrentTab(redirectUrl);
    }

    async deauthenticate(): Promise<void> {
        try {
            await this.removeAccessToken();
        } catch (e) {
            log.error('Unable to remove access token. Error: ', e.message);
        }

        // turn off connection
        await settings.disableProxy(true);
        // set proxy settings to default
        await proxy.resetSettings();
        await flagsStorage.onDeauthenticate();
        notifier.notifyListeners(notifier.types.USER_DEAUTHENTICATED);
    }

    async setAccessToken(accessToken: AuthAccessToken): Promise<void> {
        this.accessTokenData = accessToken;
        await authService.saveAccessTokenData(accessToken);
        notifier.notifyListeners(notifier.types.USER_AUTHENTICATED);
    }

    async removeAccessToken(): Promise<void> {
        this.accessTokenData = null;
        await authService.removeAccessTokenData();
    }

    /**
     * Returns access token
     * If no token is available turns off, except of when turnOffProxy flag is false
     * @param [turnOffProxy=true] - if false do not turn off proxy
     */
    async getAccessToken(turnOffProxy = true): Promise<string> {
        if (this.accessTokenData && this.accessTokenData.accessToken) {
            return this.accessTokenData.accessToken;
        }

        // if no access token, then try to get it from storage
        const accessTokenData = await authService.getAccessTokenData();

        if (accessTokenData?.accessToken) {
            this.accessTokenData = accessTokenData;
            return this.accessTokenData.accessToken;
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

    /**
     * Initializes the authentication state by waiting for the state storage to be initialized
     * and then retrieving the current authentication state from state storage.
     */
    private async innerInitState(): Promise<void> {
        await stateStorage.init();
        this.state = stateStorage.getItem(StorageKey.AuthState);
    }

    /**
     * Initializes the state of the authentication module.
     *
     * Note: You can call this method to wait for the auth to be initialized,
     * because it was implemented as it can be called multiple times but
     * initialization will happen only once.
     *
     * @returns Promise that resolves when the auth is initialized.
     */
    public async initState(): Promise<void> {
        if (!this.initStatePromise) {
            this.initStatePromise = this.innerInitState();
        }

        return this.initStatePromise;
    }

    public async init(): Promise<void> {
        const accessTokenData = await authService.getAccessTokenData();
        if (!accessTokenData?.accessToken) {
            return;
        }

        this.accessTokenData = accessTokenData;
        notifier.notifyListeners(notifier.types.USER_AUTHENTICATED);
        log.info('Authentication module is ready');
    }
}

export const auth = new Auth();
