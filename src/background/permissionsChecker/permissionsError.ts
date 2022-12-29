import { notifier } from '../../lib/notifier';

export interface ErrorData extends Error {
    status: string;
}

export interface PermissionsErrorInterface {
    setError(error: ErrorData): void;
    getError(): ErrorData | null;
    clearError(): void;
}

class PermissionsError implements PermissionsErrorInterface {
    error: ErrorData | null;

    constructor() {
        this.error = null;
    }

    setError = (error: ErrorData): void => {
        if (this.error !== error) {
            this.notifyOnUpdate(error);
        }
        this.error = error;
    };

    notifyOnUpdate = (error: ErrorData | null): void => {
        // Firefox doesn't support object created by constructor,
        // so we have to convert error to the simple object
        const simplifiedError = error ? {
            message: error.message,
            status: error.status,
        } : null;
        // Notify popup
        notifier.notifyListeners(notifier.types.PERMISSIONS_ERROR_UPDATE, simplifiedError);
    };

    getError = (): ErrorData | null => {
        return this.error;
    };

    clearError = (): void => {
        if (this.error !== null) {
            this.notifyOnUpdate(null);
        }
        this.error = null;
    };
}

export const permissionsError = new PermissionsError();
