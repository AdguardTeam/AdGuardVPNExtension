import { type ConnectivityContext } from '../../../schema/connectivity';

/**
 * Possible delays for connectivity finite state machine.
 */
export enum ConnectivityDelayType {
    RetryDelay = 'retryDelay',
}

/**
 * Connection retry delay function.
 *
 * @param context FSM context.
 * @returns Property used to keep growing delay between re-connections.
 */
function retryDelay(context: ConnectivityContext): number {
    return context.currentReconnectionDelayMs;
}

/**
 * FSM delays config.
 */
export const connectivityDelays = {
    [ConnectivityDelayType.RetryDelay]: retryDelay,
};
