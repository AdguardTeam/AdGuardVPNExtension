import { ERROR_STATUSES } from '../../lib/constants';
import notifier from '../../lib/notifier';

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
        // Notify popup
        notifier.notifyListeners(notifier.types.PERMISSIONS_ERROR_UPDATE, error);
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
