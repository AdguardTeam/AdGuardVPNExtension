import zod from 'zod';

/**
 * Context of connectivity finite state machine
 */
export const connectivityContextScheme = zod.object({
    /**
     * Count of connections retries
     */
    retryCount: zod.number(),
    /**
     * Time in ms passed since last retry with tokens and locations list refresh
     */
    timeSinceLastRetryWithRefreshMs: zod.number(),
    /**
     * Property used to keep growing delay between reconnections
     */
    currentReconnectionDelayMs: zod.number(),
    /**
     * Flag used to reconnect to another endpoint of current location
     */
    retriedConnectToOtherEndpoint: zod.boolean(),
}).strict();

/**
 * {@link connectivityContextScheme} type.
 */
export type ConnectivityContext = zod.infer<typeof connectivityContextScheme>;

/**
 * Default values for {@link ConnectivityContext}.
 */
export const CONNECTIVITY_CONTEXT_DEFAULTS: ConnectivityContext = {
    retryCount: 0,
    timeSinceLastRetryWithRefreshMs: 0,
    currentReconnectionDelayMs: 1000,
    retriedConnectToOtherEndpoint: false,
};
