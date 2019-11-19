import credentials from '../credentials';
import log from '../../lib/logger';
import { ERROR_STATUSES } from '../../lib/constants';
import permissionsError from './permissionsError';

const checkPermissions = async () => {
    await credentials.getVpnTokenRemote();
    await credentials.gainVpnCredentials(true);
    // if no error, clear permissionError
    permissionsError.clearError();
    log.info('Permissions were updated successfully');
};

const updatePermissionsErrorHandler = (error) => {
    log.error('Permissions were not updated due to:', error.message);
    // do not consider network error as a reason to set permission error
    if (error.status === ERROR_STATUSES.NETWORK_ERROR) {
        return;
    }
    permissionsError.setError(error);
};

const scheduler = (periodicFunction, errorHandler) => {
    const TIME_CHECK_INTERVAL_MS = 5 * 1000; // 5 sec
    const RUN_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

    let prevCheck = Date.now();

    setInterval(async () => {
        const currTime = Date.now();
        if (currTime >= prevCheck + RUN_INTERVAL_MS) {
            try {
                await periodicFunction();
            } catch (e) {
                errorHandler(e);
            }
            prevCheck += RUN_INTERVAL_MS;
        }
    }, TIME_CHECK_INTERVAL_MS);
};

const init = () => {
    log.info('Permissions updater was initiated');
    scheduler(checkPermissions, updatePermissionsErrorHandler);
};

const permissionsChecker = {
    init,
    checkPermissions,
};

export default permissionsChecker;
