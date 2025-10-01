import { log } from '../../common/logger';
import { notifier } from '../../common/notifier';
import { proxy } from '../proxy';
// eslint-disable-next-line import/no-cycle
import { settings } from '../settings';
import { flagsStorage } from '../flagsStorage';
import { StorageKey, type AuthAccessToken } from '../schema';
import { authService } from '../authentication/authService';
import { StateData } from '../stateStorage';

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
     * @param turnOffProxy if false do not turn off proxy, defaults to `true`.
     */
    getAccessToken(turnOffProxy?: boolean): Promise<string>;

    /**
     * Initializes authentication module.
     */
    init(): Promise<void>;
}

class Auth implements AuthInterface {
    /**
     * Auth service state data.
     * Used to save and retrieve auth state from session storage,
     * in order to persist it across service worker restarts.
     */
    private authState = new StateData(StorageKey.AuthState);

    /** @inheritdoc */
    public async isAuthenticated(turnOffProxy?: boolean): Promise<boolean> {
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
        await this.authState.update({ accessTokenData: accessToken });
        await authService.saveAccessTokenData(accessToken);
        notifier.notifyListeners(notifier.types.USER_AUTHENTICATED);
    }

    /**
     * Removes access token.
     */
    private async removeAccessToken(): Promise<void> {
        await this.authState.update({ accessTokenData: null });
        await authService.removeAccessTokenData();
    }

    /** @inheritdoc */
    public async getAccessToken(turnOffProxy = true): Promise<string> {
        const { accessTokenData } = await this.authState.get();
        if (accessTokenData && accessTokenData.accessToken) {
            return accessTokenData.accessToken;
        }

        // if no access token, then try to get it from storage
        const storageAccessTokenData = await authService.getAccessTokenData();

        if (storageAccessTokenData?.accessToken) {
            await this.authState.update({ accessTokenData: storageAccessTokenData });
            return storageAccessTokenData.accessToken;
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

    /** @inheritdoc */
    public async init(): Promise<void> {
        const accessTokenData = await authService.getAccessTokenData();
        if (!accessTokenData?.accessToken) {
            return;
        }

        await this.authState.update({ accessTokenData });
        notifier.notifyListeners(notifier.types.USER_AUTHENTICATED);
        log.info('Authentication module is ready');
    }
}

export const auth = new Auth();
