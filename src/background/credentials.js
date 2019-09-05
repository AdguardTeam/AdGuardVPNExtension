import nanoid from 'nanoid';
import { accountApi, vpnApi } from './api';
import auth from './auth';
import storage from './storage';
import log from '../lib/logger';

class Credentials {
    VPN_TOKEN_KEY = 'credentials.token';

    APP_ID_KEY = 'credentials.app.id';

    VPN_CREDENTIALS_KEY = 'credentials.vpn';

    constructor() {
        this.appId = this.gainAppId();
        this.vpnCredentials = this.getVpnCredentialsRemote();
    }

    async getVpnTokenLocal() {
        return storage.get(this.VPN_TOKEN_KEY);
    }

    async getVpnTokenRemote() {
        const accessToken = await auth.getAccessToken();
        if (!accessToken) {
            throw new Error('user is not authenticated yet');
        }
        let vpnTokenData;
        try {
            vpnTokenData = await accountApi.getVpnToken(accessToken);
        } catch (e) {
            log(e.message);
            throw new Error(`unable to get vpn token from: ${e.message}`);
        }
        const vpnToken = vpnTokenData.tokens.find(token => token.token === vpnTokenData.token);
        await storage.set(this.VPN_TOKEN_KEY, vpnToken);
        return vpnToken;
    }

    async gainVpnToken() {
        let vpnToken = await this.getVpnTokenLocal();
        if (!vpnToken) {
            vpnToken = await this.getVpnTokenRemote();
        }
        return vpnToken;
    }

    async getVpnCredentialsRemote() {
        const appId = await this.getAppId();
        const vpnToken = await this.gainVpnToken();
        let credentials;
        if (!(vpnToken && vpnToken.token)) {
            throw new Error('was unable to gain vpn token');
        }
        try {
            credentials = vpnApi.getVpnCredentials(appId, vpnToken.token);
        } catch (e) {
            log(e.message);
            throw new Error('was unable to get vpn credentials: ', e.message);
        }
        return credentials;
    }

    async getVpnCredentialsLocal() {
        let vpnCredentials;
        try {
            vpnCredentials = await storage.get(this.VPN_CREDENTIALS_KEY);
        } catch (e) {
            log.error(`unable to get vpn credentials from storage due to: ${e.message}`);
            throw e;
        }
        return vpnCredentials;
    }

    // TODO [maximtop] add validation
    areCredentialsValid(vpnCredentials) {
        if (!vpnCredentials) {
            return false;
        }
        return true;
    }

    async gainVpnCredentials() {
        let vpnCredentials;

        if (this.areCredentialsValid(this.vpnCredentials)) {
            return this.vpnCredentials;
        }

        vpnCredentials = await this.getVpnCredentialsLocal();
        if (this.areCredentialsValid(vpnCredentials)) {
            this.vpnCredentials = vpnCredentials;
            return vpnCredentials;
        }

        vpnCredentials = await this.getVpnCredentialsRemote();
        if (this.areCredentialsValid(vpnCredentials)) {
            this.vpnCredentials = vpnCredentials;
            await storage.set(this.VPN_CREDENTIALS_KEY, vpnCredentials);
            return vpnCredentials;
        }
        return 'error';
        // TODO [maximtop] notify user about error;
    }

    async gainAppId() {
        let appId;
        try {
            appId = await storage.get('APP_ID_KEY');
        } catch (e) {
            log.error(e.message);
            throw e;
        }

        if (!appId) {
            log.debug('generating app id');
            appId = nanoid();
            try {
                await storage.set('APP_ID_KEY', appId);
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
}

const endpoints = new Credentials();

export default endpoints;
