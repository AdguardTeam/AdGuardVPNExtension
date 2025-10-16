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
    type AccessCredentials,
    type CredentialsDataInterface,
    type CredentialsState,
    StorageKey,
    type VpnTokenData,
} from '../schema';
import { StateData } from '../stateStorage';
import { auth, type AuthInterface } from '../auth';
import { appStatus } from '../appStatus';
import { abTestManager } from '../abTestManager';
import { ERROR_STATUSES } from '../constants';
import { SETTINGS_IDS, type SubscriptionType } from '../../common/constants';
import { settings } from '../settings';

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
    /**
     * Returns vpn credentials state.
     *
     * @returns Vpn credentials state or `null` if not available.
     */
    getVpnCredentialsState(): Promise<CredentialsDataInterface | null>;

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
    getSubscriptionType(): Promise<SubscriptionType | null>;
    getTimeExpiresIso(): Promise<string | null>;
    getUsername(): Promise<string | null>;
    getUserRegistrationTimeISO(): Promise<string | null>;
    getUsernameAndRegistrationTimeISO(): Promise<AccountInfoData>;

    /**
     * Returns user decision on marketing consent.
     *
     * @returns Returns marketing consent status or null if it's not available.
     */
    getMarketingConsent(): Promise<boolean | null>;

    /**
     * Updates user decision on marketing consent both locally and on backend.
     *
     * @param newMarketingConsent New marketing consent value.
     */
    updateUserMarketingConsent(newMarketingConsent: boolean): Promise<void>;

    trackInstallation(): Promise<void>;
    init(): Promise<void>;
}

export class Credentials implements CredentialsInterface {
    /**
     * Credentials service state data.
     * Used to save and retrieve credentials state from session storage,
     * in order to persist it across service worker restarts.
     */
    private credentialsState = new StateData(StorageKey.CredentialsState);

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

    /** @inheritdoc */
    public async getVpnCredentialsState(): Promise<CredentialsDataInterface | null> {
        const { vpnCredentials } = await this.credentialsState.get();
        return vpnCredentials;
    }

    /**
     * Gets the VPN token from memory cache or storage.
     *
     * @returns Promise with token from memory or retrieves it from storage.
     */
    async getVpnTokenLocal(): Promise<VpnTokenData | null> {
        // Try to get from state storage first
        const { vpnToken: currentVpnToken } = await this.credentialsState.get();
        if (currentVpnToken) {
            return currentVpnToken;
        }

        // If not in state storage, get from persistent storage
        const storageVpnToken = await credentialsService.getVpnTokenFromStorage();

        // Update state storage with the retrieved token
        await this.credentialsState.update({ vpnToken: storageVpnToken });

        return storageVpnToken;
    }

    /**
     * Saves vpn token in the storage
     * @param token
     */
    async persistVpnToken(token: VpnTokenData | null): Promise<void> {
        await this.credentialsState.update({ vpnToken: token });
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
     * Checks if vpn token is valid or not.
     *
     * @param vpnToken
     *
     * @returns True if vpn token is valid or false otherwise.
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

        await this.credentialsState.update({ vpnToken });
        return vpnToken;
    }

    /**
     * Retrieves and validates VPN credentials, ensuring they are valid before returning.
     *
     * @param forceRemote Force fetching credentials from remote server.
     * @param useLocalFallback Use local fallback if remote fetch fails.
     *
     * @returns Valid VPN credentials.
     *
     * @throws An error and sets permissionsError.
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

        await this.credentialsState.update({ vpnCredentials });
        return vpnCredentials;
    }

    /**
     * Fetches VPN credentials from remote server using current VPN token.
     * Updates local storage and proxy credentials if new credentials are received.
     *
     * @returns Promise with valid VPN credentials or null.
     */
    async getVpnCredentialsRemote(): Promise<CredentialsDataInterface | null> {
        const appId = await this.getAppId();

        const vpnToken = await this.gainValidVpnToken();
        if (!vpnToken) {
            return null;
        }

        const { version } = appStatus;

        const helpUsImprove = settings.getSetting(SETTINGS_IDS.HELP_US_IMPROVE);

        const vpnCredentials = await this.vpnProvider.getVpnCredentials(appId, vpnToken.token, version, helpUsImprove);

        if (!this.areCredentialsValid(vpnCredentials)) {
            return null;
        }

        const { vpnCredentials: currentVpnCredentials } = await this.credentialsState.get();
        if (!this.areCredentialsEqual(vpnCredentials, currentVpnCredentials)) {
            await this.credentialsState.update({ vpnCredentials });
            await this.storage.set(this.VPN_CREDENTIALS_KEY, vpnCredentials);
            await this.updateProxyCredentials();
            notifier.notifyListeners(notifier.types.CREDENTIALS_UPDATED);
            log.info('Got new credentials');
        }

        return vpnCredentials;
    }

    /**
     * Checks if credentials are valid or not.
     *
     * @param vpnCredentials
     *
     * @returns True if credentials are valid.
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
     *
     * @param newCred
     * @param oldCred
     *
     * @returns True if credentials are equal, false otherwise.
     */
    areCredentialsEqual = (
        newCred: CredentialsDataInterface,
        oldCred: CredentialsDataInterface | null,
    ): boolean => {
        const path = 'result.credentials';
        return lodashGet(newCred, path) === lodashGet(oldCred, path);
    };

    getVpnCredentialsLocal = async (): Promise<CredentialsDataInterface | null> => {
        // Try to get from state storage first
        const { vpnCredentials: currentVpnCredentials } = await this.credentialsState.get();
        if (currentVpnCredentials) {
            return currentVpnCredentials;
        }

        // If not in state storage, get from persistent storage
        const storageVpnCredentials = await this.storage.get<CredentialsDataInterface>(this.VPN_CREDENTIALS_KEY)
            ?? null;

        // Update state storage with the vpn credentials
        await this.credentialsState.update({ vpnCredentials: storageVpnCredentials });

        return storageVpnCredentials;
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
     * Retrieves access credentials containing hash, VPN token and credentials for authentication.
     *
     * @returns Object with credentialsHash, vpn token and credentials.
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
     *
     * @returns App id.
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
     * Gets application ID from memory cache or generates a new one if not cached.
     *
     * @returns App id from memory or generates the new one.
     */
    getAppId = async (): Promise<string> => {
        // Try to get from state storage first
        const { appId: currentAppId } = await this.credentialsState.get();
        if (currentAppId) {
            return currentAppId;
        }

        // If not in state storage, gain it
        const gainedAppId = await this.gainAppId();

        // Update state storage with the gained app id
        await this.credentialsState.update({ appId: gainedAppId });

        return gainedAppId;
    };

    /**
     * Fetches current user info.
     *
     * @returns Account info: username and registration time in ISO format.
     */
    async fetchUserInfo(): Promise<AccountInfoData> {
        try {
            const accessToken = await this.auth.getAccessToken();
            const accountInfo = await accountProvider.getAccountInfo(accessToken);

            await this.credentialsState.update({
                username: accountInfo.username,
                registrationTime: accountInfo.registrationTimeISO,
            });

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
     * Retrieves the current VPN subscription type from the stored VPN token.
     *
     * @returns Subscription type.
     */
    getSubscriptionType = async (): Promise<SubscriptionType | null> => {
        const { vpnToken } = await this.credentialsState.get();
        return vpnToken?.vpnSubscription?.duration_v2 || null;
    };

    /**
     * Retrieves the subscription expiration time from the VPN token.
     *
     * @returns Subscription expiration time in ISO format or null if it is not available.
     */
    getTimeExpiresIso = async (): Promise<string | null> => {
        let vpnToken;
        try {
            vpnToken = await this.gainValidVpnToken();
        } catch (e) {
            return null;
        }

        if (!vpnToken) {
            return null;
        }

        const { timeExpiresIso } = vpnToken;

        if (!timeExpiresIso) {
            return null;
        }

        return timeExpiresIso;
    };

    async getUsername(): Promise<string | null> {
        try {
            // Try to get from state storage first
            const { username: currentUsername } = await this.credentialsState.get();
            if (currentUsername) {
                return currentUsername;
            }

            // If not in state storage, fetch it
            const { username: fetchedUsername } = await this.fetchUserInfo();

            // Update state storage with the fetched username
            await this.credentialsState.update({ username: fetchedUsername });

            return fetchedUsername;
        } catch (e) {
            log.debug('Error occurred while retrieving username:', e);
            return null;
        }
    }

    /**
     * Returns user registration time.
     *
     * @returns Returns registration time **in ISO format** or null if it's not available.
     */
    async getUserRegistrationTimeISO(): Promise<string | null> {
        try {
            // Try to get from state storage first
            const { registrationTime: currentRegistrationTime } = await this.credentialsState.get();
            if (currentRegistrationTime) {
                return currentRegistrationTime;
            }

            // If not in state storage, fetch it
            const { registrationTimeISO: fetchedRegistrationTime } = await this.fetchUserInfo();

            // Update state storage with the fetched registration time
            await this.credentialsState.update({ registrationTime: fetchedRegistrationTime });

            return fetchedRegistrationTime;
        } catch (e) {
            log.debug('Error occurred while retrieving registration time:', e);
            return null;
        }
    }

    /**
     * Returns user info data.
     *
     * @returns Returns username and registration time **in ISO format**.
     * @throws Throws error if it's not possible to get username and registration time.
     */
    async getUsernameAndRegistrationTimeISO(): Promise<AccountInfoData> {
        try {
            // Try to get from state storage first
            const {
                username: currentUsername,
                registrationTime: currentRegistrationTime,
            } = await this.credentialsState.get();
            if (currentUsername && currentRegistrationTime) {
                return {
                    username: currentUsername,
                    registrationTimeISO: currentRegistrationTime,
                };
            }

            // If not in state storage, fetch it
            const {
                username: fetchedUsername,
                registrationTimeISO: fetchedRegistrationTime,
            } = await this.fetchUserInfo();

            // Update state storage with the fetched data
            await this.credentialsState.update({
                username: fetchedUsername,
                registrationTime: fetchedRegistrationTime,
            });

            return {
                username: fetchedUsername,
                registrationTimeISO: fetchedRegistrationTime,
            };
        } catch (e) {
            log.debug('Error occurred while retrieving username and registration time:', e);
            throw new Error('Unable to get username and registration time');
        }
    }

    /** @inheritdoc */
    public async getMarketingConsent(): Promise<boolean | null> {
        try {
            // Try to get from state storage first
            const { marketingConsent: currentMarketingConsent } = await this.credentialsState.get();
            if (currentMarketingConsent !== null) {
                return currentMarketingConsent;
            }

            // If not in state storage, fetch it
            const accessToken = await this.auth.getAccessToken();
            const { marketingConsent: fetchedMarketingConsent } = await accountProvider.getAccountSettings(accessToken);

            // Cast to `boolean | null`
            const castedMarketingConsent = fetchedMarketingConsent ?? null;

            // Update state storage with the fetched marketing consent
            await this.credentialsState.update({ marketingConsent: castedMarketingConsent });

            return castedMarketingConsent;
        } catch (e) {
            log.debug('Error occurred while retrieving marketing consent:', e);
            return null;
        }
    }

    /** @inheritdoc */
    public async updateUserMarketingConsent(newMarketingConsent: boolean): Promise<void> {
        try {
            const accessToken = await this.auth.getAccessToken();
            await accountProvider.updateMarketingConsent(accessToken, newMarketingConsent);
            await this.credentialsState.update({ marketingConsent: newMarketingConsent });
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
        await this.storage.set(this.VPN_CREDENTIALS_KEY, null);
        await this.credentialsState.update({
            vpnCredentials: null,
            username: null,
            registrationTime: null,
            marketingConsent: null,
        });
    }

    async init(): Promise<void> {
        try {
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

                const {
                    vpnToken,
                    vpnCredentials,
                    username,
                    registrationTime,
                    marketingConsent,
                } = await this.credentialsState.get();

                const partialStateToSave: Partial<CredentialsState> = {};

                if (!vpnToken) {
                    partialStateToSave.vpnToken = await this.gainValidVpnToken(forceRemote);
                }

                if (!vpnCredentials) {
                    partialStateToSave.vpnCredentials = await this.gainValidVpnCredentials(forceRemote);
                }

                if (!username) {
                    partialStateToSave.username = await this.getUsername();
                }

                if (!registrationTime) {
                    partialStateToSave.registrationTime = await this.getUserRegistrationTimeISO();
                }

                if (marketingConsent === null) {
                    partialStateToSave.marketingConsent = await this.getMarketingConsent();
                }

                if (Object.keys(partialStateToSave).length) {
                    await this.credentialsState.update(partialStateToSave);
                }
            }
        } catch (e) {
            log.debug('Unable to init credentials module, due to error:', e.message);
        }
        log.info('Credentials module is ready');
    }
}
