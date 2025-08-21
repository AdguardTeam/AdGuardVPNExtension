import { log } from '../../common/logger';
import { notifier } from '../../common/notifier';
import { proxy } from '../proxy';
// eslint-disable-next-line import/no-cycle
import { settings } from '../settings';
import { flagsStorage } from '../flagsStorage';
import { StorageKey, type AuthAccessToken, type AuthState } from '../schema';
import { authService } from '../authentication/authService';
import { stateStorage } from '../stateStorage';

export interface AuthInterface {
    /**
     * Checks if user is authenticated.
     *
     * @param turnOffProxy If true, turns off the proxy if no access token is found.
     *
     * @returns True if user is authenticated, false otherwise.
     */
    isAuthenticated(turnOffProxy?: boolean): Promise<boolean>;

    /**
     * Deauthenticates the user.
     */
    deauthenticate(): Promise<void>;

    /**
     * Sets the access token.
     *
     * @param accessToken The access token to set.
     */
    setAccessToken(accessToken: AuthAccessToken): Promise<void>;

    /**
     * Returns access token
     * If no token is available turns off, except of when turnOffProxy flag is false
     *
     * @param [turnOffProxy=true] - if false do not turn off proxy
     */
    getAccessToken(turnOffProxy?: boolean): Promise<string>;

    /**
     * Initializes the state of the authentication module.
     *
     * Note: You can call this method to wait for the auth to be initialized,
     * because it was implemented as it can be called multiple times but
     * initialization will happen only once.
     *
     * @returns Promise that resolves when the auth is initialized.
     */
    initState(): Promise<void>;

    /**
     * Initializes authentication module.
     */
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

    /** @inheritdoc */
    public async isAuthenticated(turnOffProxy?: boolean): Promise<boolean> {
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

    /** @inheritdoc */
    public async deauthenticate(): Promise<void> {
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

    /** @inheritdoc */
    public async setAccessToken(accessToken: AuthAccessToken): Promise<void> {
        this.accessTokenData = accessToken;
        await authService.saveAccessTokenData(accessToken);
        notifier.notifyListeners(notifier.types.USER_AUTHENTICATED);
    }

    /**
     * Removes access token.
     */
    private async removeAccessToken(): Promise<void> {
        this.accessTokenData = null;
        await authService.removeAccessTokenData();
    }

    /**
     * Returns access token
     * If no token is available turns off, except of when turnOffProxy flag is false
     *
     * @param [turnOffProxy=true] - if false do not turn off proxy
     */
    public async getAccessToken(turnOffProxy = true): Promise<string> {
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

    /** @inheritdoc */
    public async initState(): Promise<void> {
        if (!this.initStatePromise) {
            this.initStatePromise = this.innerInitState();
        }

        return this.initStatePromise;
    }

    /** @inheritdoc */
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
