import throttle from 'lodash/throttle';
import { log } from '../../lib/logger';
import { ERROR_STATUSES } from '../../lib/constants';
import notifier from '../../lib/notifier';
import { settings } from '../settings';
import endpointConnectivity from '../connectivity/endpointConnectivity';
import { PermissionsErrorInterface, ErrorInterface } from './permissionsError';
import { CredentialsInterface } from '../credentials/Credentials';

interface PermissionsCheckerParameters {
    credentials: CredentialsInterface;
    permissionsError: PermissionsErrorInterface;
}

interface PermissionsCheckerInterface {
    CHECK_THROTTLE_TIMEOUT_MS: number;
    permissionsError: PermissionsErrorInterface;
    credentials: CredentialsInterface;
    intervalId: NodeJS.Timer | null;

    updatePermissionsErrorHandler(error: ErrorInterface): Promise<void>;
    checkPermissions(): Promise<void>;
    startChecker(): void;
    stopChecker(): void;
    handleUserAuthentication(): void;
    handleUserDeauthentication(): void;
    init(): void;
}

class PermissionsChecker implements PermissionsCheckerInterface {
    CHECK_THROTTLE_TIMEOUT_MS = 60 * 1000;

    permissionsError: PermissionsErrorInterface;

    credentials: CredentialsInterface;

    intervalId: NodeJS.Timer | null = null;

    constructor({ credentials, permissionsError }: PermissionsCheckerParameters) {
        this.credentials = credentials;
        this.permissionsError = permissionsError;
    }

    updatePermissionsErrorHandler = async (error: ErrorInterface): Promise<void> => {
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
        } catch (e: any) {
            log.error(e.message);
        }
    };

    checkPermissions = async (): Promise<void> => {
        try {
            // Use local fallback if there are some network problems or
            // if backend service is redeployed
            // See issue AG-2056
            await this.credentials.gainValidVpnToken(true, true);
            await this.credentials.gainValidVpnCredentials(true, true);
            // if no error, clear permissionError
            this.permissionsError.clearError();
            notifier.notifyListeners(notifier.types.UPDATE_BROWSER_ACTION_ICON);
            log.info('Permissions were checked successfully');
        } catch (e: any) {
            await this.updatePermissionsErrorHandler(e);
        }
    };

    throttledCheckPermissions = throttle(this.checkPermissions, this.CHECK_THROTTLE_TIMEOUT_MS);

    startChecker = (): void => {
        log.info('Permissions interval checker started');

        const TIME_CHECK_INTERVAL_MS = 5 * 1000; // 5 sec
        const RUN_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

        let prevCheck = Date.now();

        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        this.intervalId = setInterval(() => {
            const currTime = Date.now();
            if (currTime >= prevCheck + RUN_INTERVAL_MS) {
                this.throttledCheckPermissions();
                prevCheck += RUN_INTERVAL_MS;
            }
        }, TIME_CHECK_INTERVAL_MS);
    };

    stopChecker = (): void => {
        if (this.intervalId) {
            log.info('Permissions interval checker stopped');
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    };

    handleUserAuthentication = (): void => {
        this.permissionsError.clearError();
        this.startChecker();
    };

    handleUserDeauthentication = (): void => {
        this.permissionsError.clearError();
        this.stopChecker();
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

export default PermissionsChecker;
