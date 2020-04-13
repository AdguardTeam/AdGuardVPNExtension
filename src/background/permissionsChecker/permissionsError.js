import browserApi from '../browserApi';
import { ERROR_STATUSES, MESSAGES_TYPES } from '../../lib/constants';

class PermissionsError {
    constructor() {
        this.error = null;
    }

    setError = (error) => {
        if (this.error !== error) {
            this.notifyOnUpdate(error);
        }
        this.error = error;
    };

    notifyOnUpdate = (error) => {
        browserApi.runtime.sendMessage({
            type: MESSAGES_TYPES.PERMISSIONS_ERROR_UPDATE,
            data: error,
        });
    };

    getError = () => {
        return this.error;
    };

    /**
     * Checks if error has information about exceeded traffic limits
     * @returns {boolean}
     */
    isLimitExceeded = () => {
        return this.error?.status === ERROR_STATUSES.LIMIT_EXCEEDED;
    }

    clearError = () => {
        if (this.error !== null) {
            this.notifyOnUpdate(null);
        }
        this.error = null;
    };
}

const permissionsError = new PermissionsError();

export default permissionsError;
