import credentials from '../credentials';
import log from '../../lib/logger';
import { ERROR_STATUSES } from '../../lib/constants';
import permissionsError from './permissionsError';

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

const scheduler = (periodicFunction) => {
    const TIME_CHECK_INTERVAL_MS = 5 * 1000; // 5 sec
    const RUN_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

    let prevCheck = Date.now();

    setInterval(() => {
        const currTime = Date.now();
        if (currTime >= prevCheck + RUN_INTERVAL_MS) {
            periodicFunction();
            prevCheck += RUN_INTERVAL_MS;
        }
    }, TIME_CHECK_INTERVAL_MS);
};

const init = () => {
    log.info('Permissions updater was initiated');
    scheduler(checkPermissions);
};

const permissionsChecker = {
    init,
    checkPermissions,
};

export default permissionsChecker;
