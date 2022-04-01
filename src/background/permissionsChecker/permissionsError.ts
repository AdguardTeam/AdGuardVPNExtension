import notifier from '../../lib/notifier';

export interface ErrorInterface extends Error {
    status: string;
    message: string;
}

export interface PermissionsErrorInterface {
    error: ErrorInterface | null;
    setError(error: ErrorInterface): void;
    notifyOnUpdate(error: ErrorInterface | null): void;
    getError(): Error | null;
    clearError(): void;
}

class PermissionsError implements PermissionsErrorInterface {
    error: ErrorInterface | null;

    constructor() {
        this.error = null;
    }

    setError = (error: ErrorInterface): void => {
        if (this.error !== error) {
            this.notifyOnUpdate(error);
        }
        this.error = error;
    };

    notifyOnUpdate = (error: ErrorInterface | null): void => {
        // Firefox doesn't support object created by constructor,
        // so we have to convert error to the simple object
        const simplifiedError = error ? {
            message: error.message,
            status: error.status,
        } : null;
        // Notify popup
        notifier.notifyListeners(notifier.types.PERMISSIONS_ERROR_UPDATE, simplifiedError);
    };

    getError = (): ErrorInterface | null => {
        return this.error;
    };

    clearError = (): void => {
        if (this.error !== null) {
            this.notifyOnUpdate(null);
        }
        this.error = null;
    };
}

const permissionsError = new PermissionsError();

export default permissionsError;
