import { nanoid } from 'nanoid';
import md5 from 'crypto-js/md5';
import lodashGet from 'lodash/get';

import { type AccountInfoData, accountProvider } from '../providers/accountProvider';
import { log } from '../../common/logger';
import { notifier } from '../../common/notifier';
import type { VpnProviderInterface } from '../providers/vpnProvider';
import type { PermissionsErrorInterface } from '../permissionsChecker/permissionsError';
import type { StorageInterface } from '../browserApi/storage';
import type { ExtensionProxyInterface } from '../proxy/proxy';
import {
    AccessCredentials,
    VpnTokenData,
    CredentialsState,
    CredentialsDataInterface,
    StorageKey,
} from '../schema';
import { stateStorage } from '../stateStorage';
import { auth, type AuthInterface } from '../auth';
import { appStatus } from '../appStatus';
import { abTestManager } from '../abTestManager';
import { ERROR_STATUSES } from '../constants';

import { credentialsService } from './credentialsService';

export interface AccessCredentialsData {
    credentialsHash: string,
    credentials: AccessCredentials,
    token: string,
}

export interface CredentialsParameters {
    browserApi: {
        storage: StorageInterface,
    };
    vpnProvider: VpnProviderInterface;
    permissionsError: PermissionsErrorInterface;
    proxy: ExtensionProxyInterface;
    auth: AuthInterface;
}

export interface CredentialsInterface {
    vpnCredentials: CredentialsDataInterface | null;

    persistVpnToken(token: VpnTokenData | null): Promise<void>;
    gainVpnToken(
        forceRemote: boolean,
        useLocalFallback: boolean,
    ): Promise<VpnTokenData | null>;
    gainValidVpnToken(
        forceRemote: boolean,
        useLocalFallback: boolean,
    ): Promise<VpnTokenData>;
    gainValidVpnCredentials(
        forceRemote: boolean,
        useLocalFallback: boolean,
    ): Promise<CredentialsDataInterface>;
    areCredentialsEqual(
        newCred: CredentialsDataInterface,
        oldCred: CredentialsDataInterface | null,
    ): boolean;
    getAppId(): Promise<string>;
    isPremiumToken(): Promise<boolean>;
    nextBillDate(): Promise<number | null>;
    getUsername(): Promise<string | null>;
    getUserRegistrationTimeISO(): Promise<string | null>;
    getUsernameAndRegistrationTimeISO(): Promise<AccountInfoData>;
    trackInstallation(): Promise<void>;
    init(): Promise<void>;
}

export class Credentials implements CredentialsInterface {
    state: CredentialsState;

    APP_ID_KEY = 'credentials.app.id';

    VPN_CREDENTIALS_KEY = 'credentials.vpn';

    storage: StorageInterface;

    vpnProvider: VpnProviderInterface;

    permissionsError: PermissionsErrorInterface;

    proxy: ExtensionProxyInterface;

    auth: AuthInterface;

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

    saveCredentialsState = () => {
        stateStorage.setItem(StorageKey.CredentialsState, this.state);
    };

    get vpnToken() {
        return this.state.vpnToken;
    }

    set vpnToken(vpnToken: VpnTokenData | null) {
        this.state.vpnToken = vpnToken;
        this.saveCredentialsState();
    }

    get vpnCredentials() {
        return this.state.vpnCredentials;
    }

    set vpnCredentials(vpnCredentials: CredentialsDataInterface | null) {
        this.state.vpnCredentials = vpnCredentials;
        this.saveCredentialsState();
    }

    /**
     * Returns current username.
     */
    get currentUsername() {
        return this.state.currentUsername;
    }

    /**
     * Sets current username.
     */
    set currentUsername(currentUsername: string | null) {
        this.state.currentUsername = currentUsername;
        this.saveCredentialsState();
    }

    /**
     * Returns current user registration time in ISO format
     */
    get currentUserRegistrationTime() {
        return this.state.currentUserRegistrationTime;
    }

    /**
     * Sets current user registration time in ISO format
     */
    set currentUserRegistrationTime(registrationTime: string | null) {
        this.state.currentUserRegistrationTime = registrationTime;
        this.saveCredentialsState();
    }

    get appId() {
        return this.state.appId;
    }

    set appId(appId: string | null) {
        this.state.appId = appId;
        this.saveCredentialsState();
    }

    /**
     * Returns token from memory or retrieves it from storage
     */
    async getVpnTokenLocal(): Promise<VpnTokenData | null> {
        if (this.vpnToken) {
            return this.vpnToken;
        }
        this.vpnToken = await credentialsService.getVpnTokenFromStorage();
        return this.vpnToken || null;
    }

    /**
     * Saves vpn token in the storage
     * @param token
     */
    async persistVpnToken(token: VpnTokenData | null): Promise<void> {
        this.vpnToken = token;
        await credentialsService.setVpnTokenToStorage(token);

        // notify popup that premium token state could have been changed
        // this is necessary when we check permissions after limit exceeded error
        const isPremiumToken = await credentialsService.isPremiumUser();
        notifier.notifyListeners(
            notifier.types.TOKEN_PREMIUM_STATE_UPDATED,
            isPremiumToken,
        );
    }

    async getVpnTokenRemote(): Promise<VpnTokenData | null> {
        const accessToken = await this.auth.getAccessToken();

        let vpnToken = null;

        try {
            vpnToken = await accountProvider.getVpnToken(accessToken);
        } catch (e) {
            if (e.status === ERROR_STATUSES.UNAUTHORIZED) {
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
    ): Promise<VpnTokenData | null> {
        let vpnToken = null;

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
     */
    isTokenValid(vpnToken: VpnTokenData | null): boolean {
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
    ): Promise<VpnTokenData> {
        const vpnToken = await this.gainVpnToken(forceRemote, useLocalFallback);

        if (!vpnToken || !this.isTokenValid(vpnToken)) {
            const error = Error(`Vpn token is not valid. Token: ${JSON.stringify(vpnToken)}`);
            this.permissionsError.setError(error);
            throw error;
        }

        this.vpnToken = vpnToken;
        return vpnToken;
    }

    /**
     * Returns valid vpn credentials or throws an error and sets permissionsError
     * @param forceRemote
     * @param useLocalFallback
     */
    async gainValidVpnCredentials(
        forceRemote = false,
        useLocalFallback = true,
    ): Promise<CredentialsDataInterface> {
        let vpnCredentials;
        try {
            vpnCredentials = await this.gainVpnCredentials(useLocalFallback, forceRemote);
        } catch (e) {
            this.permissionsError.setError(e);
            throw e;
        }

        if (!vpnCredentials || !this.areCredentialsValid(vpnCredentials)) {
            const error = Error(`Vpn credentials are not valid: Credentials: ${JSON.stringify(vpnCredentials)}`);
            this.permissionsError.setError({ ...error, status: '' });
            throw error;
        }

        this.vpnCredentials = vpnCredentials;
        return vpnCredentials;
    }

    /**
     * Returns valid vpn credentials or null
     */
    async getVpnCredentialsRemote(): Promise<CredentialsDataInterface | null> {
        const appId = await this.getAppId();

        const vpnToken = await this.gainValidVpnToken();
        if (!vpnToken) {
            return null;
        }

        const { version } = appStatus;

        const vpnCredentials = await this.vpnProvider.getVpnCredentials(appId, vpnToken.token, version);

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
     */
    areCredentialsValid(vpnCredentials: CredentialsDataInterface | null): boolean {
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
     */
    areCredentialsEqual = (
        newCred: CredentialsDataInterface,
        oldCred: CredentialsDataInterface | null,
    ): boolean => {
        const path = 'result.credentials';
        return lodashGet(newCred, path) === lodashGet(oldCred, path);
    };

    getVpnCredentialsLocal = async (): Promise<CredentialsDataInterface | null> => {
        if (this.vpnCredentials) {
            return this.vpnCredentials;
        }

        this.vpnCredentials = await this.storage.get<CredentialsDataInterface>(this.VPN_CREDENTIALS_KEY) || null;
        return this.vpnCredentials;
    };

    async gainVpnCredentials(
        useLocalFallback: boolean,
        forceRemote = false,
    ): Promise<CredentialsDataInterface | null> {
        let vpnCredentials = null;

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
        const { credentials } = await this.getAccessCredentials();
        await this.proxy.setAccessCredentials(credentials);
    };

    /**
     * Returns credentialsHash, vpn token and credentials
     */
    async getAccessCredentials(): Promise<AccessCredentialsData> {
        const vpnToken = await this.gainValidVpnToken();
        const { token } = vpnToken;
        const { result: { credentials } } = await this.gainValidVpnCredentials();
        const appId = await this.getAppId();
        return {
            credentialsHash: md5(`${appId}:${token}:${credentials}`).toString(),
            credentials: { username: token, password: credentials },
            token: token || '',
        };
    }

    /**
     * Retrieves app id from storage or generates the new one and saves it in the storage
     * @return {Promise<*>}
     */
    gainAppId = async (): Promise<string> => {
        let appId = await this.storage.get<string>(this.APP_ID_KEY);

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

    /**
     * Fetches current user info.
     *
     * @return Account info: username and registration time in ISO format.
     */
    async fetchUserInfo(): Promise<AccountInfoData> {
        try {
            const accessToken = await this.auth.getAccessToken();
            const accountInfo = await accountProvider.getAccountInfo(accessToken);

            this.currentUsername = accountInfo.username;
            this.currentUserRegistrationTime = accountInfo.registrationTimeISO;

            return accountInfo;
        } catch (e) {
            if (e?.status === ERROR_STATUSES.UNAUTHORIZED) {
                log.debug('Auth denied, token is not valid');
                // deauthenticate user
                await this.auth.deauthenticate();
                // clear vpnToken
                this.persistVpnToken(null);
            }
            throw e;
        }
    }

    /**
     * Checks if current user's token has license key, then it is considered as premium.
     *
     * @returns Returns promise that resolves to true if token is premium and false otherwise.
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
     * Returns subscription type
     */
    getSubscriptionType = () => {
        return this.vpnToken?.vpnSubscription?.duration_v2;
    };

    /**
     * Returns next bill date in the numeric representation (ms)
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
            const { username } = await this.fetchUserInfo();
            this.currentUsername = username;
        } catch (e) {
            log.debug(e);
        }

        return this.currentUsername;
    }

    /**
     * Returns user registration time.
     *
     * @returns Returns registration time **in ISO format** or null if it's not available.
     */
    async getUserRegistrationTimeISO(): Promise<string | null> {
        if (this.currentUserRegistrationTime) {
            return this.currentUserRegistrationTime;
        }

        try {
            const { registrationTimeISO: registrationTime } = await this.fetchUserInfo();
            this.currentUserRegistrationTime = registrationTime;
        } catch (e) {
            log.debug(e);
        }

        return this.currentUserRegistrationTime;
    }

    /**
     * Returns user info data.
     *
     * @returns Returns username and registration time **in ISO format**.
     * @throws Throws error if it's not possible to get username and registration time.
     */
    async getUsernameAndRegistrationTimeISO(): Promise<AccountInfoData> {
        if (this.currentUsername && this.currentUserRegistrationTime) {
            return {
                username: this.currentUsername,
                registrationTimeISO: this.currentUserRegistrationTime,
            };
        }

        try {
            const { username, registrationTimeISO: registrationTime } = await this.fetchUserInfo();
            this.currentUsername = username;
            this.currentUserRegistrationTime = registrationTime;
        } catch (e) {
            log.debug(e);
        }

        if (!this.currentUsername || !this.currentUserRegistrationTime) {
            throw new Error('Unable to get username and registration time');
        }

        return {
            username: this.currentUsername,
            registrationTimeISO: this.currentUserRegistrationTime,
        };
    }

    /**
     * Method used to track installations
     * It will be called on every extension launch or attempt to connect to proxy
     */
    async trackInstallation(): Promise<void> {
        const TRACKED_INSTALLATIONS_KEY = 'credentials.tracked.installations';
        try {
            const tracked = await this.storage.get(TRACKED_INSTALLATIONS_KEY);
            if (tracked) {
                return;
            }

            const appId = await this.getAppId();
            const { version } = appStatus;

            const experiments = abTestManager.getExperiments();
            const response = await this.vpnProvider.trackExtensionInstallation(appId, version, experiments);
            await abTestManager.setVersions(response.experiments);

            await this.storage.set(TRACKED_INSTALLATIONS_KEY, true);
            log.info('Installation successfully tracked');
        } catch (e) {
            log.error('Error occurred during track request', e.message);
        }
    }

    async handleUserDeauthentication(): Promise<void> {
        await this.persistVpnToken(null);
        this.vpnCredentials = null;
        await this.storage.set(this.VPN_CREDENTIALS_KEY, null);
        this.currentUsername = null;
        this.currentUserRegistrationTime = null;
    }

    async init(): Promise<void> {
        try {
            this.state = stateStorage.getItem(StorageKey.CredentialsState);

            notifier.addSpecifiedListener(
                notifier.types.USER_DEAUTHENTICATED,
                this.handleUserDeauthentication.bind(this),
            );

            await this.trackInstallation();

            const forceRemote = true;

            const isUserAuthenticated = await auth.isAuthenticated(false);

            if (isUserAuthenticated) {
                // Use persisted state on extension initialization.
                // If it's not available, get data remotely
                this.vpnToken = this.vpnToken || await this.gainValidVpnToken(forceRemote);
                this.vpnCredentials = this.vpnCredentials || await this.gainValidVpnCredentials(forceRemote);

                this.currentUsername = this.currentUsername || await this.getUsername();

                this.currentUserRegistrationTime = this.currentUserRegistrationTime
                    || await this.getUserRegistrationTimeISO();
            }
        } catch (e) {
            log.debug('Unable to init credentials module, due to error:', e.message);
        }
        log.info('Credentials module is ready');
    }
}
