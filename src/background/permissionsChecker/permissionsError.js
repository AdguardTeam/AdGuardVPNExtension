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
        // Firefox doesn't support object created by constructor,
        // so we have to convert error to the simple object
        const simplifiedError = error ? {
            message: error.message,
            status: error.status,
        } : null;
        // Notify popup
        notifier.notifyListeners(notifier.types.PERMISSIONS_ERROR_UPDATE, simplifiedError);
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
