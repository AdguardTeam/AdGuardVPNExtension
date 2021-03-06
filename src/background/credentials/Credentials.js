import { nanoid } from 'nanoid';
import md5 from 'crypto-js/md5';
import lodashGet from 'lodash/get';
import accountProvider from '../providers/accountProvider';
import { log } from '../../lib/logger';
import notifier from '../../lib/notifier';

class Credentials {
    VPN_TOKEN_KEY = 'credentials.token';

    APP_ID_KEY = 'credentials.app.id';

    VPN_CREDENTIALS_KEY = 'credentials.vpn';

    constructor({
        browserApi, vpnProvider, permissionsError, proxy, auth,
    }) {
        this.storage = browserApi.storage;
        this.vpnProvider = vpnProvider;
        this.permissionsError = permissionsError;
        this.proxy = proxy;
        this.auth = auth;
    }

    /**
     * Returns token from memory or retrieves it from storage
     * @returns {Promise<*>}
     */
    async getVpnTokenLocal() {
        if (this.vpnToken) {
            return this.vpnToken;
        }
        this.vpnToken = await this.storage.get(this.VPN_TOKEN_KEY);
        return this.vpnToken;
    }

    /**
     * Saves vpn token in the storage
     * @param token
     * @returns {Promise<void>}
     */
    async persistVpnToken(token) {
        this.vpnToken = token;
        await this.storage.set(this.VPN_TOKEN_KEY, token);

        // notify popup that premium token state could have been changed
        // this is necessary when we check permissions after limit exceeded error
        const isPremiumToken = !!token?.licenseKey;
        notifier.notifyListeners(
            notifier.types.TOKEN_PREMIUM_STATE_UPDATED,
            isPremiumToken,
        );
    }

    async getVpnTokenRemote() {
        const accessToken = await this.auth.getAccessToken();

        let vpnToken = null;

        try {
            vpnToken = await accountProvider.getVpnToken(accessToken);
        } catch (e) {
            if (e.status === 401) {
                log.debug('Access token expired');
                // deauthenticate user
                await this.auth.deauthenticate();
                // clear vpnToken
                this.persistVpnToken(null);
                return null;
            }

            throw e;
        }

        // save vpnToken in memory
        this.persistVpnToken(vpnToken);
        return vpnToken;
    }

    async gainVpnToken(forceRemote = false, useLocalFallback = true) {
        let vpnToken;

        if (forceRemote) {
            try {
                vpnToken = await this.getVpnTokenRemote();
            } catch (e) {
                if (!useLocalFallback) {
                    throw e;
                }
            }
            // fallback if was unable to get vpn token remotely
            if (!vpnToken && useLocalFallback) {
                vpnToken = await this.getVpnTokenLocal();
            }
            return vpnToken;
        }

        vpnToken = await this.getVpnTokenLocal();
        // fallback if was unable to get locally
        if (!vpnToken) {
            vpnToken = await this.getVpnTokenRemote();
        }
        return vpnToken;
    }

    /**
     * Checks if vpn token is valid or not
     * @param vpnToken
     * @returns {boolean}
     */
    isTokenValid(vpnToken) {
        const VALID_VPN_TOKEN_STATUS = 'VALID';
        if (!vpnToken) {
            return false;
        }

        const { licenseStatus, timeExpiresSec } = vpnToken;
        if (!licenseStatus || !timeExpiresSec) {
            return false;
        }

        const currentTimeSec = Math.ceil(Date.now() / 1000);

        return !(licenseStatus !== VALID_VPN_TOKEN_STATUS || timeExpiresSec < currentTimeSec);
    }

    async gainValidVpnToken(forceRemote = false, useLocalFallback = true) {
        const vpnToken = await this.gainVpnToken(forceRemote, useLocalFallback);

        if (!this.isTokenValid(vpnToken)) {
            const error = Error(`Vpn token is not valid. Token: ${JSON.stringify(vpnToken)}`);
            this.permissionsError.setError(error);
            throw error;
        }

        return vpnToken;
    }

    /**
     * Returns valid vpn credentials or throws an error and sets permissionsError
     * @param forceRemote
     * @param useLocalFallback
     * @returns {Promise<*>}
     */
    async gainValidVpnCredentials(forceRemote = false, useLocalFallback = true) {
        let vpnCredentials;
        try {
            vpnCredentials = await this.gainVpnCredentials(forceRemote, useLocalFallback);
        } catch (e) {
            this.permissionsError.setError(e);
            throw e;
        }

        if (!this.areCredentialsValid(vpnCredentials)) {
            const error = Error(`Vpn credentials are not valid: Credentials: ${JSON.stringify(vpnCredentials)}`);
            this.permissionsError.setError(error);
            throw error;
        }

        return vpnCredentials;
    }

    /**
     * Returns valid vpn credentials or null
     * @returns {Promise}
     */
    async getVpnCredentialsRemote() {
        const appId = this.getAppId();

        const vpnToken = await this.gainValidVpnToken();
        const vpnCredentials = await this.vpnProvider.getVpnCredentials(appId, vpnToken.token);

        if (!this.areCredentialsValid(vpnCredentials)) {
            return null;
        }

        if (!this.areCredentialsEqual(vpnCredentials, this.vpnCredentials)) {
            this.vpnCredentials = vpnCredentials;
            await this.storage.set(this.VPN_CREDENTIALS_KEY, vpnCredentials);
            await this.updateProxyCredentials();
            notifier.notifyListeners(notifier.types.CREDENTIALS_UPDATED);
            log.info('Got new credentials');
        }

        return vpnCredentials;
    }

    /**
     * Checks if credentials are valid or not
     * @param vpnCredentials
     * @returns {boolean}
     */
    areCredentialsValid(vpnCredentials) {
        const VALID_CREDENTIALS_STATUS = 'VALID';
        const LIMIT_EXCEEDED_CREDENTIALS_STATUS = 'LIMIT_EXCEEDED';

        if (!vpnCredentials) {
            return false;
        }

        const { licenseStatus, timeExpiresSec } = vpnCredentials;
        if (!licenseStatus || !timeExpiresSec) {
            return false;
        }

        const currentTimeSec = Math.ceil(Date.now() / 1000);

        return (licenseStatus === VALID_CREDENTIALS_STATUS
            || licenseStatus === LIMIT_EXCEEDED_CREDENTIALS_STATUS)
            && timeExpiresSec >= currentTimeSec;
    }

    /**
     * Checks if credential strings are equal
     * credentials object example:
     * const credentialsObject = {
     *       licenseStatus: "VALID",
     *       result: {
     *           credentials: "fcofp9dhhve2nxjx",
     *           expiresInSec: 13825,
     *       },
     *       timeExpiresSec: 4728282135
     *   }
     * @param newCred
     * @param oldCred
     * @returns {boolean}
     */
    areCredentialsEqual = (newCred, oldCred) => {
        const path = 'result.credentials';
        return lodashGet(newCred, path) === lodashGet(oldCred, path);
    };

    getVpnCredentialsLocal = async () => {
        if (this.vpnCredentials) {
            return this.vpnCredentials;
        }
        const vpnCredentials = await this.storage.get(this.VPN_CREDENTIALS_KEY);
        this.vpnCredentials = vpnCredentials;
        return vpnCredentials;
    };

    async gainVpnCredentials(forceRemote = false, useLocalFallback) {
        let vpnCredentials;

        if (forceRemote) {
            try {
                vpnCredentials = await this.getVpnCredentialsRemote();
            } catch (e) {
                // Do not use local credentials if request to credentials
                // returns limit exceeded error
                if (!useLocalFallback) {
                    throw e;
                }
            }
            // fallback if was unable to get valid remote vpn credentials
            if (!this.areCredentialsValid(vpnCredentials) && useLocalFallback) {
                vpnCredentials = await this.getVpnCredentialsLocal();
            }
            return vpnCredentials;
        }

        vpnCredentials = await this.getVpnCredentialsLocal();
        // fallback if was unable to get valid local vpn credentials
        if (!this.areCredentialsValid(vpnCredentials)) {
            vpnCredentials = await this.getVpnCredentialsRemote();
        }

        return vpnCredentials;
    }

    updateProxyCredentials = async () => {
        const { credentialsHash, credentials } = await this.getAccessCredentials();
        await this.proxy.setAccessPrefix(credentialsHash, credentials);
    };

    /**
     * Returns credentialsHash, vpn token and credentials
     * @returns {Promise<{
     *                      credentialsHash: string,
     *                      token: string,
     *                      credentials: {password: string, username: string}
     *                  }>}
     */
    async getAccessCredentials() {
        const { token } = await this.gainValidVpnToken();
        const { result: { credentials } } = await this.gainValidVpnCredentials();
        const appId = this.getAppId();
        return {
            credentialsHash: md5(`${appId}:${token}:${credentials}`).toString(),
            credentials: { username: token, password: credentials },
            token,
        };
    }

    async gainAppId() {
        let appId = await this.storage.get(this.APP_ID_KEY);

        if (!appId) {
            log.debug('Generating new app id');
            appId = nanoid();
            await this.storage.set(this.APP_ID_KEY, appId);
        }
        return appId;
    }

    getAppId() {
        return this.appId;
    }

    async fetchUsername() {
        const accessToken = await this.auth.getAccessToken();
        return accountProvider.getAccountInfo(accessToken);
    }

    /**
     * Checks if token has license key, then this token is considered premium
     * @returns {Promise<boolean>}
     */
    isPremiumToken = async () => {
        let vpnToken;
        try {
            vpnToken = await this.gainValidVpnToken();
        } catch (e) {
            return false;
        }

        if (!vpnToken) {
            return false;
        }

        return !!vpnToken.licenseKey;
    }

    async getUsername() {
        if (this.currentUsername) {
            return this.currentUsername;
        }

        try {
            this.currentUsername = await this.fetchUsername();
        } catch (e) {
            log.debug(e);
        }

        return this.currentUsername;
    }

    /**
     * After every new install or update posts request to the server if wasn't posted yet
     * @param runInfo
     * @param appId
     * @returns {Promise<void>}
     */
    async trackInstallation(runInfo, appId) {
        const TRACKED_INSTALLATIONS_KEY = 'credentials.tracked.installations';
        if (runInfo.isFirstRun || runInfo.isUpdate) {
            try {
                const tracked = await this.storage.get(TRACKED_INSTALLATIONS_KEY);
                if (tracked) {
                    return;
                }
                await this.vpnProvider.postExtensionInstalled(appId);
                await this.storage.set(TRACKED_INSTALLATIONS_KEY, true);
                log.info('Installation successfully tracked');
            } catch (e) {
                log.error('Error occurred during track request', e.message);
            }
        }
    }

    async handleUserDeauthentication() {
        await this.persistVpnToken(null);
        this.vpnCredentials = null;
        await this.storage.set(this.VPN_CREDENTIALS_KEY, null);
        this.currentUsername = null;
    }

    async init(runInfo) {
        try {
            notifier.addSpecifiedListener(
                notifier.types.USER_DEAUTHENTICATED,
                this.handleUserDeauthentication.bind(this),
            );

            this.appId = await this.gainAppId();
            await this.trackInstallation(runInfo, this.appId);

            // On extension initialisation use local fallback if was unable to get data remotely
            // it might be useful on browser restart
            const forceRemote = true;
            this.vpnToken = await this.gainValidVpnToken(forceRemote);
            this.vpnCredentials = await this.gainValidVpnCredentials(forceRemote);
            this.currentUsername = await this.fetchUsername();
        } catch (e) {
            log.debug('Unable to init credentials module, due to error:', e.message);
        }
        log.info('Credentials module is ready');
    }
}

export default Credentials;
