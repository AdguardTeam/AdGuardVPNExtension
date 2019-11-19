class CustomError extends Error {
    constructor(status, ...params) {
        super(...params);
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CustomError);
        }
        this.name = 'CustomError';
        // Custom debugging information
        this.status = status;
    }
}

export default CustomError;
