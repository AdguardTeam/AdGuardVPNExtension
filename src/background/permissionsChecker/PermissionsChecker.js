import throttle from 'lodash/throttle';
import log from '../../lib/logger';
import { ERROR_STATUSES } from '../../lib/constants';
import notifier from '../../lib/notifier';
import settings from '../settings/settings';

class PermissionsChecker {
    CHECK_THROTTLE_TIMEOUT_MS = 60 * 1000;

    constructor({ credentials, permissionsError }) {
        this.credentials = credentials;
        this.permissionsError = permissionsError;
    }

    updatePermissionsErrorHandler = async (error) => {
        log.error('Permissions were not updated due to:', error.message);
        // do not consider network error as a reason to set permission error
        if (error.status === ERROR_STATUSES.NETWORK_ERROR) {
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

    checkPermissions = async () => {
        try {
            await this.credentials.gainValidVpnToken(true, false);
            await this.credentials.gainValidVpnCredentials(true, false);
            // if no error, clear permissionError
            this.permissionsError.clearError();
            log.info('Permissions were checked successfully');
        } catch (e) {
            await this.updatePermissionsErrorHandler(e);
        }
    };

    throttledCheckPermissions = throttle(this.checkPermissions, this.CHECK_THROTTLE_TIMEOUT_MS);

    intervalId = null;

    startChecker = () => {
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

    stopChecker = () => {
        if (this.intervalId) {
            log.info('Permissions interval checker stopped');
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    };

    /**
     * Listens to connection state change
     * When browser comes online, updates permissions
     */
    handleConnectionChange = () => {
        window.addEventListener('online', async () => {
            log.info('Browser switched to online mode');
            this.throttledCheckPermissions();
        });
    };

    handleUserAuthentication = () => {
        this.permissionsError.clearError();
        this.startChecker();
    };

    handleUserDeauthentication = () => {
        this.permissionsError.clearError();
        this.stopChecker();
    };

    init = () => {
        notifier.addSpecifiedListener(
            notifier.types.USER_AUTHENTICATED,
            this.handleUserAuthentication
        );
        notifier.addSpecifiedListener(
            notifier.types.USER_DEAUTHENTICATED,
            this.handleUserDeauthentication
        );
        this.handleConnectionChange();
        log.info('Permissions checker module initiated');
    };
}

export default PermissionsChecker;
