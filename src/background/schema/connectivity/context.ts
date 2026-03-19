import * as v from 'valibot';

/**
 * Context of connectivity finite state machine
 */
export const connectivityContextScheme = v.strictObject({
    /**
     * Count of connections retries
     */
    retryCount: v.number(),
    /**
     * Time in ms passed since last retry with tokens and locations list refresh
     */
    timeSinceLastRetryWithRefreshMs: v.number(),
    /**
     * Property used to keep growing delay between reconnections
     */
    currentReconnectionDelayMs: v.number(),
    /**
     * Flag used to reconnect to another endpoint of current location
     */
    retriedConnectToOtherEndpoint: v.boolean(),
});

/**
 * {@link connectivityContextScheme} type.
 */
export type ConnectivityContext = v.InferOutput<typeof connectivityContextScheme>;

/**
 * Default values for {@link ConnectivityContext}.
 */
export const CONNECTIVITY_CONTEXT_DEFAULTS: ConnectivityContext = {
    retryCount: 0,
    timeSinceLastRetryWithRefreshMs: 0,
    currentReconnectionDelayMs: 1000,
    retriedConnectToOtherEndpoint: false,
};
