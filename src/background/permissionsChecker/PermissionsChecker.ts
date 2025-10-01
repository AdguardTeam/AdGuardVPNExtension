import { log } from '../../common/logger';
import { notifier } from '../../common/notifier';
import { settings } from '../settings';
import { endpointConnectivity } from '../connectivity/endpointConnectivity';
import { ERROR_STATUSES } from '../constants';
import { type CredentialsInterface } from '../credentials/Credentials';
import { vpnProvider } from '../providers/vpnProvider';
import { timers } from '../timers';
import { StateData } from '../stateStorage';
import { StorageKey } from '../schema';
import { auth } from '../auth';

import { type PermissionsErrorInterface, type ErrorData } from './permissionsError';

interface PermissionsCheckerParameters {
    credentials: CredentialsInterface;
    permissionsError: PermissionsErrorInterface;
}

export interface PermissionsCheckerInterface {
    checkPermissions(): Promise<void>;
    init(): void;
}

export const UPDATE_CREDENTIALS_INTERVAL_MS = 1000 * 60 * 60 * 12; // 12 hours
export const UPDATE_VPN_INFO_INTERVAL_MS = 1000 * 60 * 60; // 1 hour
export const EXPIRE_CHECK_TIME_SEC = 60 * 30; // 30 min

export class PermissionsChecker implements PermissionsCheckerInterface {
    /**
     * Permissions checker service state data.
     * Used to save and retrieve permissions checker state from session storage,
     * in order to persist it across service worker restarts.
     */
    private permissionsCheckerState = new StateData(StorageKey.PermissionsChecker);

    permissionsError: PermissionsErrorInterface;

    credentials: CredentialsInterface;

    constructor({ credentials, permissionsError }: PermissionsCheckerParameters) {
        this.credentials = credentials;
        this.permissionsError = permissionsError;
    }

    updatePermissionsErrorHandler = async (error: ErrorData): Promise<void> => {
        log.error('Permissions were not updated due to:', error.message);
        // do not consider network error as a reason to set permission error
        // or if websocket connection still is open
        if (error.status === ERROR_STATUSES.NETWORK_ERROR
            || endpointConnectivity.isWebsocketConnectionOpen()) {
            return;
        }
        this.permissionsError.setError(error);

        // clear proxy settings if error occurred,
        // in order not to block connections with broken proxy
        try {
            await settings.disableProxy(true);
        } catch (e) {
            log.error(e.message);
        }
    };

    /**
     * Request credentials in half an hour before expired
     */
    planCredentialsCheckBeforeExpired = async (): Promise<void> => {
        const vpnCredentialsState = await this.credentials.getVpnCredentialsState();
        if (!vpnCredentialsState) {
            return;
        }
        if (vpnCredentialsState?.result?.expiresInSec
            && vpnCredentialsState.result.expiresInSec > EXPIRE_CHECK_TIME_SEC) {
            let { expiredCredentialsCheckTimeoutId } = await this.permissionsCheckerState.get();
            if (expiredCredentialsCheckTimeoutId) {
                timers.clearTimeout(expiredCredentialsCheckTimeoutId);
            }
            const nextTimeoutMs = (vpnCredentialsState.result.expiresInSec - EXPIRE_CHECK_TIME_SEC) * 1000;
            expiredCredentialsCheckTimeoutId = timers.setTimeout(async () => {
                await this.checkPermissions();
            }, nextTimeoutMs);
            await this.permissionsCheckerState.update({ expiredCredentialsCheckTimeoutId });
        }
    };

    checkPermissions = async (): Promise<void> => {
        const isUserAuthenticated = await auth.isAuthenticated(false);
        // don't check permissions for not authenticated users
        if (!isUserAuthenticated) {
            return;
        }
        try {
            // Use local fallback if there are some network problems or
            // if backend service is redeployed
            // See issue AG-2056
            await this.credentials.gainValidVpnToken(true, true);
            const vpnCredentials = await this.credentials.gainValidVpnCredentials(true, true);
            const vpnCredentialsState = await this.credentials.getVpnCredentialsState();
            if (vpnCredentials && !this.credentials.areCredentialsEqual(
                vpnCredentials,
                vpnCredentialsState,
            )) {
                await this.planCredentialsCheckBeforeExpired();
            }
            // if no error, clear permissionError
            this.permissionsError.clearError();
            notifier.notifyListeners(notifier.types.UPDATE_BROWSER_ACTION_ICON);
            log.info('Permissions were checked successfully');
        } catch (e) {
            // if got an error on token or credentials check,
            // stop credentials check before expired
            const { expiredCredentialsCheckTimeoutId } = await this.permissionsCheckerState.get();
            if (expiredCredentialsCheckTimeoutId) {
                timers.clearTimeout(expiredCredentialsCheckTimeoutId);
            }
            await this.updatePermissionsErrorHandler(e);
        }
    };

    getVpnInfo = async (): Promise<void> => {
        try {
            const appId = await this.credentials.getAppId();
            const vpnToken = await this.credentials.gainValidVpnToken(true, true);
            if (!vpnToken) {
                return;
            }
            const vpnInfo = await vpnProvider.getVpnExtensionInfo(appId, vpnToken.token);
            if (vpnInfo.refreshTokens) {
                await this.checkPermissions();
            }
            // if no error, clear vpnInfoError
            this.permissionsError.clearError();
            log.info('VPN info was checked successfully');
        } catch (e) {
            await this.updatePermissionsErrorHandler(e);
        }
    };

    startChecker = async (): Promise<void> => {
        log.info('Credentials and VPN info checker started');

        let { credentialsCheckTimerId, vpnInfoCheckTimerId } = await this.permissionsCheckerState.get();

        if (credentialsCheckTimerId) {
            timers.clearInterval(credentialsCheckTimerId);
        }
        credentialsCheckTimerId = timers.setInterval(async () => {
            await this.checkPermissions();
        }, UPDATE_CREDENTIALS_INTERVAL_MS);

        if (vpnInfoCheckTimerId) {
            timers.clearInterval(vpnInfoCheckTimerId);
        }
        vpnInfoCheckTimerId = timers.setInterval(async () => {
            await this.getVpnInfo();
        }, UPDATE_VPN_INFO_INTERVAL_MS);

        await this.permissionsCheckerState.update({
            credentialsCheckTimerId,
            vpnInfoCheckTimerId,
        });
    };

    stopChecker = async (): Promise<void> => {
        let {
            credentialsCheckTimerId,
            vpnInfoCheckTimerId,
            expiredCredentialsCheckTimeoutId,
        } = await this.permissionsCheckerState.get();

        if (credentialsCheckTimerId) {
            log.info('Credentials checker stopped');
            timers.clearInterval(credentialsCheckTimerId);
            credentialsCheckTimerId = null;
        }

        if (vpnInfoCheckTimerId) {
            log.info('VPN info checker stopped');
            timers.clearInterval(vpnInfoCheckTimerId);
            vpnInfoCheckTimerId = null;
        }

        if (expiredCredentialsCheckTimeoutId) {
            log.info('Checker before credentials expired stopped');
            timers.clearTimeout(expiredCredentialsCheckTimeoutId);
            expiredCredentialsCheckTimeoutId = null;
        }

        await this.permissionsCheckerState.update({
            credentialsCheckTimerId,
            vpnInfoCheckTimerId,
            expiredCredentialsCheckTimeoutId,
        });
    };

    handleUserAuthentication = async (): Promise<void> => {
        this.permissionsError.clearError();
        await this.startChecker();
        await this.planCredentialsCheckBeforeExpired();
    };

    handleUserDeauthentication = async (): Promise<void> => {
        this.permissionsError.clearError();
        await this.stopChecker();
    };

    init = (): void => {
        notifier.addSpecifiedListener(
            notifier.types.USER_AUTHENTICATED,
            this.handleUserAuthentication,
        );
        notifier.addSpecifiedListener(
            notifier.types.USER_DEAUTHENTICATED,
            this.handleUserDeauthentication,
        );
        log.info('Permissions checker module initiated');
    };
}
