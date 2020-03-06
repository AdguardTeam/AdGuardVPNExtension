import nanoid from 'nanoid';
import md5 from 'crypto-js/md5';
import lodashGet from 'lodash/get';
import accountProvider from './providers/accountProvider';
import auth from './auth';
import browserApi from './browserApi';
import log from '../lib/logger';
import vpnProvider from './providers/vpnProvider';
import permissionsError from './permissionsChecker/permissionsError';
import notifier from '../lib/notifier';
import { proxy } from './proxy';

class Credentials {
    VPN_TOKEN_KEY = 'credentials.token';

    APP_ID_KEY = 'credentials.app.id';

    VPN_CREDENTIALS_KEY = 'credentials.vpn';

    constructor(browserApi) {
        this.storage = browserApi.storage;
    }

    async getVpnTokenLocal() {
        if (this.vpnToken) {
            return this.vpnToken;
        }
        return this.storage.get(this.VPN_TOKEN_KEY);
    }

    async persistVpnToken(token) {
        this.vpnToken = token;
        await this.storage.set(this.VPN_TOKEN_KEY, token);
    }

    async getVpnTokenRemote() {
        const accessToken = await auth.getAccessToken();

        let vpnToken = null;

        try {
            vpnToken = await accountProvider.getVpnToken(accessToken);
        } catch (e) {
            if (e.status === 401) {
                log.debug('Access token expired');
                // deauthenticate user
                await auth.deauthenticate();
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

    async gainVpnToken(forceRemote, useLocalFallback) {
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

    isValid(vpnToken) {
        const VALID_VPN_TOKEN_STATUS = 'VALID';
        return !!(vpnToken && vpnToken.licenseStatus === VALID_VPN_TOKEN_STATUS);
    }

    async gainValidVpnToken(forceRemote = false, useLocalFallback = true) {
        const vpnToken = await this.gainVpnToken(forceRemote, useLocalFallback);

        if (!this.isValid(vpnToken)) {
            const error = Error(`Vpn token is not valid. Token: ${JSON.stringify(vpnToken)}`);
            permissionsError.setError(error);
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
        const vpnCredentials = await this.gainVpnCredentials(forceRemote, useLocalFallback);

        if (!this.areCredentialsValid(vpnCredentials)) {
            const error = Error(`Vpn credentials are not valid: Credentials: ${JSON.stringify(vpnCredentials)}`);
            permissionsError.setError(error);
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
        const vpnCredentials = await vpnProvider.getVpnCredentials(appId, vpnToken.token);

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

    areCredentialsValid(vpnCredentials) {
        if (!vpnCredentials) {
            return false;
        }
        const { licenseStatus, timeExpiresSec } = vpnCredentials;
        const currentTimeSec = Math.ceil(Date.now() / 1000);
        return !(licenseStatus !== 'VALID' || timeExpiresSec < currentTimeSec);
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
        const { prefix } = await this.getAccessCredentials();
        await proxy.setAccessPrefix(prefix);
    };

    /**
     * Returns domain prefix and vpn token
     * @returns {Promise<{prefix: string, token: string}>}
     */
    async getAccessCredentials() {
        const { token } = await this.gainValidVpnToken();
        const { result: { credentials } } = await this.gainValidVpnCredentials();
        const appId = this.getAppId();
        return {
            prefix: md5(`${appId}:${token}:${credentials}`).toString(),
            token,
        };
    }

    async gainAppId() {
        let appId;
        try {
            appId = await this.storage.get(this.APP_ID_KEY);
        } catch (e) {
            log.error(e.message);
            throw e;
        }

        if (!appId) {
            log.debug('generating app id');
            appId = nanoid();
            try {
                await this.storage.set(this.APP_ID_KEY, appId);
            } catch (e) {
                log.error(e.message);
                throw e;
            }
        }
        return appId;
    }

    getAppId() {
        return this.appId;
    }

    async fetchUsername() {
        const accessToken = await auth.getAccessToken();
        return accountProvider.getAccountInfo(accessToken);
    }

    async getUsername() {
        if (this.currentUsername) {
            return this.currentUsername;
        }
        return this.fetchUsername();
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
                await vpnProvider.postExtensionInstalled(appId);
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
                this.handleUserDeauthentication.bind(this)
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

const credentials = new Credentials(browserApi);

export default credentials;
