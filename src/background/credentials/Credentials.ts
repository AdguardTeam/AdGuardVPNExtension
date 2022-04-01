import { nanoid } from 'nanoid';
// @ts-ignore
import md5 from 'crypto-js/md5';
import lodashGet from 'lodash/get';

import accountProvider from '../providers/accountProvider';
import { log } from '../../lib/logger';
import notifier from '../../lib/notifier';
import { vpnProvider, CredentialsDataInterface, VpnProviderInterface } from '../providers/vpnProvider';
import {
    UPDATE_CREDENTIALS_INTERVAL_MS,
    UPDATE_VPN_INFO_INTERVAL_MS,
} from '../../lib/constants';
import { ErrorInterface, PermissionsErrorInterface } from '../permissionsChecker/permissionsError';

const HALF_HOUR_SEC = 1800;

interface VpnTokenData {
    token: string;
    licenseStatus: string;
    timeExpiresSec: number;
    licenseKey: string;
    subscription: boolean;
    vpnSubscription: {
        next_bill_date_iso: string,
    };
}

interface StorageInterface {
    set: (key: string, data: any) => Promise<any>;
    get: (key: string) => Promise<any>;
}

interface AuthInterface {
    getAccessToken: () => Promise<string>;
    deauthenticate: () => void;
}

interface ProxyInterface {
    setAccessPrefix: (
        credentialsHash: string,
        credentials: {
            username: string | undefined,
            password: string,
        },
    ) => Promise<{ domainName: any }>;
}

interface CredentialsParameters {
    browserApi: {
        storage: StorageInterface,
    };
    vpnProvider: VpnProviderInterface;
    permissionsError: PermissionsErrorInterface;
    proxy: ProxyInterface;
    auth: AuthInterface;
}

export interface CredentialsInterface {
    VPN_TOKEN_KEY: string;
    APP_ID_KEY: string;
    VPN_CREDENTIALS_KEY: string;
    storage: StorageInterface;
    vpnProvider: VpnProviderInterface | null | undefined;
    permissionsError: PermissionsErrorInterface;
    proxy: ProxyInterface;
    auth: AuthInterface;
    vpnToken: VpnTokenData | null | undefined;
    vpnCredentials: CredentialsDataInterface | null | undefined;
    appId: string;
    currentUsername: string | null;

    getVpnTokenLocal(): Promise<VpnTokenData | null | undefined>;
    persistVpnToken(token: VpnTokenData | null): Promise<void>;
    getVpnTokenRemote(): Promise<VpnTokenData | null | undefined>;
    gainVpnToken(
        forceRemote: boolean,
        useLocalFallback: boolean,
    ): Promise<VpnTokenData | null | undefined>;
    isTokenValid(vpnToken: VpnTokenData | null | undefined): boolean;
    gainValidVpnToken(
        forceRemote: boolean,
        useLocalFallback: boolean,
    ): Promise<VpnTokenData | null | undefined>;
    gainValidVpnCredentials(
        forceRemote: boolean,
        useLocalFallback: boolean,
    ): Promise<CredentialsDataInterface>;
    getVpnCredentialsRemote(): Promise<CredentialsDataInterface | null>;
    areCredentialsValid(vpnCredentials: CredentialsDataInterface | null | undefined): boolean;
    areCredentialsEqual(
        newCred: CredentialsDataInterface,
        oldCred: CredentialsDataInterface
    ): boolean;
    getVpnCredentialsLocal(): Promise<CredentialsDataInterface>;
    gainVpnCredentials(
        useLocalFallback: boolean,
        forceRemote: boolean,
    ): Promise<CredentialsDataInterface | undefined | null>;
    updateProxyCredentials(): Promise<void>;
    gainAppId(): Promise<string>;
    getAppId(): Promise<string>;
    isPremiumToken(): Promise<boolean>;
    nextBillDate(): Promise<number | null>;
    getUsername(): Promise<string | null>;
    trackInstallation(): Promise<void>;
    handleUserDeauthentication(): Promise<void>;
    initCredentialsPeriodicUpdate(): void;
    initVpnExtensionInfoPeriodicUpdate(): void;
    initDataUpdates(): void;
    checkCredentialsBeforeExpired(): Promise<void>;
    updateVpnCredentials(): Promise<void>;
    init(): Promise<void>;
}

class Credentials implements CredentialsInterface {
    VPN_TOKEN_KEY = 'credentials.token';

    APP_ID_KEY = 'credentials.app.id';

    VPN_CREDENTIALS_KEY = 'credentials.vpn';

    storage: StorageInterface;

    vpnProvider: VpnProviderInterface | null | undefined;

    permissionsError: PermissionsErrorInterface;

    proxy: ProxyInterface;

    auth: AuthInterface;

    vpnToken: VpnTokenData | null | undefined;

    vpnCredentials: CredentialsDataInterface | null | undefined;

    appId: string;

    currentUsername: string | null;

    constructor({
        browserApi,
        vpnProvider,
        permissionsError,
        proxy,
        auth,
    }: CredentialsParameters) {
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
    async getVpnTokenLocal(): Promise<VpnTokenData | null | undefined> {
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
    async persistVpnToken(token: VpnTokenData | null): Promise<void> {
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

    async getVpnTokenRemote(): Promise<VpnTokenData | null | undefined> {
        const accessToken = await this.auth.getAccessToken();

        let vpnToken = null;

        try {
            vpnToken = await accountProvider.getVpnToken(accessToken);
        } catch (e: any) {
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

    async gainVpnToken(
        forceRemote = false,
        useLocalFallback = true,
    ): Promise<VpnTokenData | null | undefined> {
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
    isTokenValid(vpnToken: VpnTokenData | null | undefined): boolean {
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

    async gainValidVpnToken(
        forceRemote = false,
        useLocalFallback = true,
    ): Promise<VpnTokenData | null | undefined> {
        const vpnToken = await this.gainVpnToken(forceRemote, useLocalFallback);

        if (!this.isTokenValid(vpnToken)) {
            const error = Error(`Vpn token is not valid. Token: ${JSON.stringify(vpnToken)}`);
            this.permissionsError.setError(error as ErrorInterface);
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
    async gainValidVpnCredentials(
        forceRemote = false,
        useLocalFallback = true,
    ): Promise<CredentialsDataInterface> {
        let vpnCredentials;
        try {
            vpnCredentials = await this.gainVpnCredentials(useLocalFallback, forceRemote);
        } catch (e: any) {
            this.permissionsError.setError(e);
            throw e;
        }

        if (!vpnCredentials || !this.areCredentialsValid(vpnCredentials)) {
            const error = Error(`Vpn credentials are not valid: Credentials: ${JSON.stringify(vpnCredentials)}`);
            this.permissionsError.setError(error as ErrorInterface);
            throw error;
        }

        return vpnCredentials;
    }

    /**
     * Returns valid vpn credentials or null
     * @returns {Promise}
     */
    async getVpnCredentialsRemote(): Promise<CredentialsDataInterface | null> {
        const appId = await this.getAppId();

        const vpnToken = await this.gainValidVpnToken();
        const vpnCredentials = await this.vpnProvider?.getVpnCredentials(appId, vpnToken?.token);

        if (!vpnCredentials || !this.areCredentialsValid(vpnCredentials)) {
            return null;
        }

        if (this.vpnCredentials && !this.areCredentialsEqual(vpnCredentials, this.vpnCredentials)) {
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
    areCredentialsValid(vpnCredentials: CredentialsDataInterface | null | undefined): boolean {
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
    areCredentialsEqual = (
        newCred: CredentialsDataInterface,
        oldCred: CredentialsDataInterface,
    ): boolean => {
        const path = 'result.credentials';
        return lodashGet(newCred, path) === lodashGet(oldCred, path);
    };

    getVpnCredentialsLocal = async (): Promise<CredentialsDataInterface> => {
        if (this.vpnCredentials) {
            return this.vpnCredentials;
        }
        const vpnCredentials = await this.storage.get(this.VPN_CREDENTIALS_KEY);
        this.vpnCredentials = vpnCredentials;
        return vpnCredentials;
    };

    async gainVpnCredentials(
        useLocalFallback: boolean,
        forceRemote = false,
    ): Promise<CredentialsDataInterface | undefined | null> {
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

    updateProxyCredentials = async (): Promise<void> => {
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
        const vpnToken = await this.gainValidVpnToken();
        const token = vpnToken?.token;
        const { result: { credentials } } = await this.gainValidVpnCredentials();
        const appId = await this.getAppId();
        return {
            credentialsHash: md5(`${appId}:${token}:${credentials}`).toString(),
            credentials: { username: token, password: credentials },
            token,
        };
    }

    /**
     * Retrieves app id from storage or generates the new one and saves it in the storage
     * @return {Promise<*>}
     */
    gainAppId = async (): Promise<string> => {
        let appId = await this.storage.get(this.APP_ID_KEY);

        if (!appId) {
            log.debug('Generating new app id');
            appId = nanoid();
            await this.storage.set(this.APP_ID_KEY, appId);
        }

        return appId;
    };

    /**
     * Returns app id from memory or generates the new one
     * @return {Promise<*>}
     */
    getAppId = async (): Promise<string> => {
        if (!this.appId) {
            this.appId = await this.gainAppId();
        }

        return this.appId;
    };

    async fetchUsername() {
        const accessToken = await this.auth.getAccessToken();
        return accountProvider.getAccountInfo(accessToken);
    }

    /**
     * Checks if token has license key, then this token is considered premium
     * @returns {Promise<boolean>}
     */
    isPremiumToken = async (): Promise<boolean> => {
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
    };

    /**
     * Returns next bill date in the numeric representation
     * @returns {Promise<number|null>} next bill date in ms
     */
    nextBillDate = async (): Promise<number | null> => {
        let vpnToken;
        try {
            vpnToken = await this.gainValidVpnToken();
        } catch (e) {
            return null;
        }

        if (!vpnToken) {
            return null;
        }

        const { next_bill_date_iso: nextBillDateIso } = vpnToken.vpnSubscription || {};

        if (!nextBillDateIso) {
            return null;
        }

        let time;
        try {
            time = new Date(nextBillDateIso);
        } catch (e) {
            log.debug('Was unable to parse time from:', nextBillDateIso, e);
            return null;
        }

        return time.getTime();
    };

    async getUsername(): Promise<string | null> {
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
     * Method used to track installations
     * It will be called on every extension launch or attempt to connect to proxy
     * @returns {Promise<void>}
     */
    async trackInstallation(): Promise<void> {
        const TRACKED_INSTALLATIONS_KEY = 'credentials.tracked.installations';
        try {
            const tracked = await this.storage.get(TRACKED_INSTALLATIONS_KEY);
            if (tracked) {
                return;
            }
            const appId = await this.getAppId();
            await this.vpnProvider?.postExtensionInstalled(appId);
            await this.storage.set(TRACKED_INSTALLATIONS_KEY, true);
            log.info('Installation successfully tracked');
        } catch (e: any) {
            log.error('Error occurred during track request', e.message);
        }
    }

    async handleUserDeauthentication(): Promise<void> {
        await this.persistVpnToken(null);
        this.vpnCredentials = null;
        await this.storage.set(this.VPN_CREDENTIALS_KEY, null);
        this.currentUsername = null;
    }

    /**
     * Updates credentials every 24 hours (UPDATE_CREDENTIALS_INTERVAL_MS)
     */
    initCredentialsPeriodicUpdate = (): void => {
        setInterval(async () => {
            const forceRemote = true;
            this.vpnCredentials = await this.gainValidVpnCredentials(forceRemote);
        }, UPDATE_CREDENTIALS_INTERVAL_MS);
    };

    /**
     * Updates vpn extension info every hour (UPDATE_VPN_INFO_INTERVAL_MS)
     */
    initVpnExtensionInfoPeriodicUpdate = (): void => {
        setInterval(async () => {
            const forceRemote = true;
            const vpnToken = await this.gainValidVpnToken(forceRemote);
            const appId = await this.getAppId();
            const vpnInfo = await vpnProvider.getVpnExtensionInfo(appId, vpnToken?.token);
            if (vpnInfo.refreshTokens) {
                this.vpnCredentials = await this.gainValidVpnCredentials(forceRemote);
            }
        }, UPDATE_VPN_INFO_INTERVAL_MS);
    };

    initDataUpdates(): void {
        this.initCredentialsPeriodicUpdate();
        this.initVpnExtensionInfoPeriodicUpdate();
    }

    /**
     * Request credentials in half an hour before expired
     * @returns Promise<void>
     */
    checkCredentialsBeforeExpired = async (): Promise<void> => {
        if (this?.vpnCredentials?.result?.expiresInSec
            && this.vpnCredentials.result.expiresInSec > HALF_HOUR_SEC) {
            setTimeout(async () => {
                await this.updateVpnCredentials();
            }, (this.vpnCredentials.result.expiresInSec - HALF_HOUR_SEC) * 1000);
        } else {
            await this.updateVpnCredentials();
        }
    };

    async updateVpnCredentials(): Promise<void> {
        // On extension initialisation use local fallback if was unable to get data remotely
        // it might be useful on browser restart
        const forceRemote = true;
        this.vpnToken = await this.gainValidVpnToken(forceRemote);
        this.vpnCredentials = await this.gainValidVpnCredentials(forceRemote);
    }

    async init(): Promise<void> {
        try {
            notifier.addSpecifiedListener(
                notifier.types.USER_AUTHENTICATED,
                this.initDataUpdates.bind(this),
            );

            notifier.addSpecifiedListener(
                notifier.types.USER_DEAUTHENTICATED,
                this.handleUserDeauthentication.bind(this),
            );

            await this.trackInstallation();
            await this.updateVpnCredentials();
            await this.checkCredentialsBeforeExpired();
            this.currentUsername = await this.fetchUsername();
        } catch (e: any) {
            log.debug('Unable to init credentials module, due to error:', e.message);
        }
        log.info('Credentials module is ready');
    }
}

export default Credentials;
