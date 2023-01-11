import { log } from '../../lib/logger';
import { ERROR_STATUSES } from '../../lib/constants';
import { notifier } from '../../lib/notifier';
import { settings } from '../settings';
import { endpointConnectivity } from '../connectivity/endpointConnectivity';
import { PermissionsErrorInterface, ErrorData } from './permissionsError';
import { CredentialsInterface } from '../credentials/Credentials';
import { vpnProvider } from '../providers/vpnProvider';
import { timers } from '../timers';

interface PermissionsCheckerParameters {
    credentials: CredentialsInterface;
    permissionsError: PermissionsErrorInterface;
}

export interface PermissionsCheckerInterface {
    checkPermissions(): Promise<void>;
    init(): void;
}

export const UPDATE_CREDENTIALS_INTERVAL_MS = 1000 * 60 * 60 * 12; // 12 hours
export const UPDATE_CREDENTIALS_INTERVAL_MINUTES = 60 * 12; // 12 hours
export const UPDATE_VPN_INFO_INTERVAL_MS = 1000 * 60 * 60; // 1 hour
export const UPDATE_VPN_INFO_INTERVAL_MINUTES = 60; // 1 hour
const EXPIRE_CHECK_TIME_SEC = 60 * 30; // 30 min

export class PermissionsChecker implements PermissionsCheckerInterface {
    permissionsError: PermissionsErrorInterface;

    credentials: CredentialsInterface;

    credentialsCheckTimerId: number | null = null;

    vpnInfoCheckTimerId: number | null = null;

    expiredCredentialsCheckTimeoutId: number | null = null;

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
     * @returns Promise<void>
     */
    planCredentialsCheckBeforeExpired = async (): Promise<void> => {
        if (!this.credentials.vpnCredentials) {
            return;
        }
        if (this.credentials.vpnCredentials?.result?.expiresInSec
            && this.credentials.vpnCredentials.result.expiresInSec > EXPIRE_CHECK_TIME_SEC) {
            if (this.expiredCredentialsCheckTimeoutId) {
                timers.clearTimeout(this.expiredCredentialsCheckTimeoutId);
            }
            this.expiredCredentialsCheckTimeoutId = timers.setTimeout(async () => {
                await this.checkPermissions();
                // eslint-disable-next-line max-len
            }, (this.credentials.vpnCredentials.result.expiresInSec - EXPIRE_CHECK_TIME_SEC) * 1000);
        }
    };

    checkPermissions = async (): Promise<void> => {
        try {
            // Use local fallback if there are some network problems or
            // if backend service is redeployed
            // See issue AG-2056
            await this.credentials.gainValidVpnToken(true, true);
            const vpnCredentials = await this.credentials.gainValidVpnCredentials(true, true);
            if (vpnCredentials && !this.credentials.areCredentialsEqual(
                vpnCredentials,
                this.credentials.vpnCredentials,
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
            if (this.expiredCredentialsCheckTimeoutId) {
                timers.clearTimeout(this.expiredCredentialsCheckTimeoutId);
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

        if (this.credentialsCheckTimerId) {
            timers.clearInterval(this.credentialsCheckTimerId);
        }

        this.credentialsCheckTimerId = timers.setInterval(async () => {
            await this.checkPermissions();
        }, UPDATE_CREDENTIALS_INTERVAL_MS);

        if (this.vpnInfoCheckTimerId) {
            timers.clearInterval(this.vpnInfoCheckTimerId);
        }
        this.vpnInfoCheckTimerId = timers.setInterval(async () => {
            await this.getVpnInfo();
        }, UPDATE_VPN_INFO_INTERVAL_MS);
    };

    stopChecker = async (): Promise<void> => {
        if (this.credentialsCheckTimerId) {
            log.info('Credentials checker stopped');
            timers.clearInterval(this.credentialsCheckTimerId);
            this.credentialsCheckTimerId = null;
        }

        if (this.vpnInfoCheckTimerId) {
            log.info('VPN info checker stopped');
            timers.clearInterval(this.vpnInfoCheckTimerId);
            this.vpnInfoCheckTimerId = null;
        }

        if (this.expiredCredentialsCheckTimeoutId) {
            log.info('Checker before credentials expired stopped');
            timers.clearTimeout(this.expiredCredentialsCheckTimeoutId);
            this.expiredCredentialsCheckTimeoutId = null;
        }
    };

    handleUserAuthentication = async (): Promise<void> => {
        this.permissionsError.clearError();
        this.startChecker();
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
