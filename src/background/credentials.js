import nanoid from 'nanoid';
import md5 from 'crypto-js/md5';
import accountProvider from './providers/accountProvider';
import auth from './auth';
import storage from './storage';
import log from '../lib/logger';
import vpnProvider from './providers/vpnProvider';
import { ERROR_STATUSES } from '../lib/constants';
import permissionsError from './permissionsChecker/permissionsError';

class Credentials {
    VPN_TOKEN_KEY = 'credentials.token';

    APP_ID_KEY = 'credentials.app.id';

    VPN_CREDENTIALS_KEY = 'credentials.vpn';

    async getVpnTokenLocal() {
        if (this.vpnToken) {
            return this.vpnToken;
        }
        return storage.get(this.VPN_TOKEN_KEY);
    }

    async persistVpnToken(token) {
        this.vpnToken = token;
        await storage.set(this.VPN_TOKEN_KEY, token);
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

            if (e.status === ERROR_STATUSES.NETWORK_ERROR) {
                log.debug('Network error occurred', e.message);
                return null;
            }

            log.debug(e.message);
            return null;
        }

        // save vpnToken in memory
        this.persistVpnToken(vpnToken);
        return vpnToken;
    }

    async gainVpnToken(forceRemote) {
        let vpnToken;

        if (forceRemote) {
            vpnToken = await this.getVpnTokenRemote();
            // fallback if was unable to get remote
            if (!vpnToken) {
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

    async gainValidVpnToken(forceRemote) {
        const vpnToken = await this.gainVpnToken(forceRemote);

        if (!this.isValid(vpnToken)) {
            const error = Error(`Received token is not valid. It equals: ${JSON.stringify(vpnToken)}`);
            permissionsError.setError(error);
            throw error;
        }

        return vpnToken;
    }

    async getVpnCredentialsRemote() {
        const appId = await this.getAppId();
        let credentials;
        try {
            const vpnToken = await this.gainValidVpnToken();
            credentials = await vpnProvider.getVpnCredentials(appId, vpnToken.token);
        } catch (e) {
            log.error(e.message);
            throw new Error(`Unable to get vpn credentials, reason: ${e.message}`);
        }
        return credentials;
    }

    async getVpnCredentialsFromStorage() {
        let vpnCredentials;
        try {
            vpnCredentials = await storage.get(this.VPN_CREDENTIALS_KEY);
        } catch (e) {
            log.error(`Unable to get vpn credentials from storage, reason: ${e.message}`);
            throw e;
        }
        return vpnCredentials;
    }

    areCredentialsValid(vpnCredentials) {
        if (!vpnCredentials) {
            return false;
        }
        const { licenseStatus, timeExpiresSec } = vpnCredentials;
        const currentTimeSec = Math.ceil(Date.now() / 1000);
        if (licenseStatus !== 'VALID' || timeExpiresSec < currentTimeSec) {
            return false;
        }
        return true;
    }

    async gainVpnCredentials(remoteForce) {
        let vpnCredentials;

        if (!remoteForce) {
            if (this.areCredentialsValid(this.vpnCredentials)) {
                return this.vpnCredentials;
            }

            vpnCredentials = await this.getVpnCredentialsFromStorage();
            if (this.areCredentialsValid(vpnCredentials)) {
                this.vpnCredentials = vpnCredentials;
                return vpnCredentials;
            }
        }

        vpnCredentials = await this.getVpnCredentialsRemote();
        if (this.areCredentialsValid(vpnCredentials)) {
            this.vpnCredentials = vpnCredentials;
            await storage.set(this.VPN_CREDENTIALS_KEY, vpnCredentials);
            return vpnCredentials;
        }

        throw new Error('Unable to get vpn credentials');
    }

    async getAccessPrefix() {
        const { token } = await this.gainValidVpnToken();
        const { result: { credentials } } = await this.gainVpnCredentials();
        const appId = this.getAppId();
        // format: md5(<app_id>:<token>:<creds>)
        return md5(`${appId}:${token}:${credentials}`).toString();
    }

    async gainAppId() {
        let appId;
        try {
            appId = await storage.get(this.APP_ID_KEY);
        } catch (e) {
            log.error(e.message);
            throw e;
        }

        if (!appId) {
            log.debug('generating app id');
            appId = nanoid();
            try {
                await storage.set(this.APP_ID_KEY, appId);
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

    async init() {
        try {
            this.appId = await this.gainAppId();
            this.vpnToken = await this.gainVpnToken(true);
            this.vpnCredentials = await this.getVpnCredentialsRemote();
            this.currentUsername = await this.fetchUsername();
        } catch (e) {
            log.debug('Unable to init credential, reason:', e.message);
        }
        log.info('Credentials module is ready');
    }
}

const credentials = new Credentials();

export default credentials;
