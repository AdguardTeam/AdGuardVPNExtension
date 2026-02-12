/**
 * Returns the ping value if it is a valid non-negative number,
 * otherwise returns `null` (triggering local measurement fallback).
 *
 * @param ping Raw ping value from the backend API.
 *
 * @returns Validated ping in milliseconds, or `null`.
 */
export const parseBackendPing = (ping: number | null | undefined): number | null => {
    if (ping === null || ping === undefined || ping < 0) {
        return null;
    }

    return ping;
};
