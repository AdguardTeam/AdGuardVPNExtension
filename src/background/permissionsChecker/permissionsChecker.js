import throttle from 'lodash/throttle';
import credentials from '../credentials';
import log from '../../lib/logger';
import { ERROR_STATUSES } from '../../lib/constants';
import permissionsError from './permissionsError';
import notifier from '../../lib/notifier';

const CHECK_THROTTLE_TIMEOUT_MS = 60 * 1000;

const updatePermissionsErrorHandler = (error) => {
    log.error('Permissions were not updated due to:', error.message);
    // do not consider network error as a reason to set permission error
    if (error.status === ERROR_STATUSES.NETWORK_ERROR) {
        return;
    }
    permissionsError.setError(error);
};

const checkPermissions = async () => {
    try {
        await credentials.getVpnTokenRemote();
        await credentials.gainVpnCredentials(true);
        // if no error, clear permissionError
        permissionsError.clearError();
        log.info('Permissions were updated successfully');
    } catch (e) {
        updatePermissionsErrorHandler(e);
    }
};

const throttledCheckPermissions = throttle(checkPermissions, CHECK_THROTTLE_TIMEOUT_MS);

let intervalId = null;

const startChecker = () => {
    log.info('Permissions interval checker started');

    const TIME_CHECK_INTERVAL_MS = 5 * 1000; // 5 sec
    const RUN_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

    let prevCheck = Date.now();

    if (intervalId) {
        clearInterval(intervalId);
    }

    intervalId = setInterval(() => {
        const currTime = Date.now();
        if (currTime >= prevCheck + RUN_INTERVAL_MS) {
            throttledCheckPermissions();
            prevCheck += RUN_INTERVAL_MS;
        }
    }, TIME_CHECK_INTERVAL_MS);
};

const stopChecker = () => {
    if (intervalId) {
        log.info('Permissions interval checker stopped');
        clearInterval(intervalId);
        intervalId = null;
    }
};

/**
 * Listens to connection state change
 * When browser comes online, updates permissions
 */
const handleConnectionChange = () => {
    window.addEventListener('online', async () => {
        log.info('Browser switched to online mode');
        throttledCheckPermissions();
    });
};

const handleUserAuthentication = () => {
    permissionsError.clearError();
    startChecker();
};

const handleUserDeauthentication = () => {
    permissionsError.clearError();
    stopChecker();
};

const init = () => {
    notifier.addSpecifiedListener(notifier.types.USER_AUTHENTICATED, handleUserAuthentication);
    notifier.addSpecifiedListener(notifier.types.USER_DEAUTHENTICATED, handleUserDeauthentication);
    handleConnectionChange();
    log.info('Permissions checker module initiated');
};

const permissionsChecker = {
    init,
    checkPermissions,
};

export default permissionsChecker;
