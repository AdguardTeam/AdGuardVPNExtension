/**
 * Error thrown when a queued task is cancelled by `clear()`.
 */
export class CancelledError extends Error {
    constructor() {
        super('Task was cancelled');
        this.name = 'CancelledError';
    }
}
