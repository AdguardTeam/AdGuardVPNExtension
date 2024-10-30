import { assign } from 'xstate';

import { log } from '../../../../common/logger';
import { CONNECTIVITY_CONTEXT_DEFAULTS, type ConnectivityContext } from '../../../schema/connectivity';
import { switcher } from '../../switcher';

import { type ConnectivityEvent } from './events';

/**
 * Possible actions of connectivity finite state machine.
 */
export enum ConnectivityActionType {
    TurnOnProxy = 'turnOnProxy',
    TurnOffProxy = 'turnOffProxy',
    RetryConnection = 'retryConnection',
    SetTimeSinceLastRetryWithRefreshMs = 'setTimeSinceLastRetryWithRefreshMs',
    IncrementRetryCount = 'incrementRetryCount',
    IncrementDelay = 'incrementDelay',
    ResetOnSuccessfulConnection = 'resetOnSuccessfulConnection',
}

const MAX_RECONNECTION_DELAY_MS = 1000 * 60 * 3; // 3 minutes
const RECONNECTION_DELAY_GROW_FACTOR = 1.3;
const RETRY_CONNECTION_TIME_MS = 70000; // 70 seconds

/**
 * Turns on proxy.
 */
async function turnOnProxy(): Promise<void> {
    try {
        await switcher.turnOn();
    } catch (e) {
        log.debug(e);
    }
}

/**
 * Turns off proxy.
 */
async function turnOffProxy(): Promise<void> {
    try {
        await switcher.turnOff();
    } catch (e) {
        log.debug(e);
    }
}

/**
 * After 70 seconds of fruitless reconnection attempts to previously selected endpoint we
 *      1. re-fetch tokens, vpn info and locations list from the backend
 *      2. choose endpoint once again (it's possible that the one that previously failed
 *          is already excluded from the list)
 *      3. retrying connection attempts (probably to another endpoint)
 *
 * Why 70 seconds:
 * There are 2 possible kinds of failures:
 *      1. short term (OOM & restart, deployment of a new version)
 *      2. long term (server dead or brought down intentionally)
 * We don't want our users rambling between endpoints and overloading them when (1) occurs,
 * so we bring in 70 seconds threshold after which we treat the unavailability as (2)
 * and try find another one (backend probably has alternatives in this case).
 */
async function retryConnection({
    timeSinceLastRetryWithRefreshMs,
}: ConnectivityContext): Promise<void> {
    if (timeSinceLastRetryWithRefreshMs > RETRY_CONNECTION_TIME_MS) {
        // retry to connect after tokens, VPN info and locations refresh
        await switcher.retryTurnOn(true);
    } else {
        // Retries to connect to ws without cache refresh
        await switcher.retryTurnOn();
    }
}

/**
 * Sets timeSinceLastRetryWithRefreshMs to 0 if it's greater than {@link RETRY_CONNECTION_TIME_MS},
 * else doesn't change it.
 */
const setTimeSinceLastRetryWithRefreshMs = assign<ConnectivityContext, ConnectivityEvent>({
    timeSinceLastRetryWithRefreshMs: ({ timeSinceLastRetryWithRefreshMs }) => {
        if (timeSinceLastRetryWithRefreshMs > RETRY_CONNECTION_TIME_MS) {
            return 0;
        }
        return timeSinceLastRetryWithRefreshMs;
    },
});

/**
 * Increments count of connection retries and time passed since first retry.
 */
const incrementRetryCount = assign<ConnectivityContext, ConnectivityEvent>({
    retryCount: (context) => {
        return context.retryCount + 1;
    },
    timeSinceLastRetryWithRefreshMs: (context) => {
        return context.timeSinceLastRetryWithRefreshMs + context.currentReconnectionDelayMs;
    },
});

/**
 * Increases delay between reconnection.
 */
const incrementDelay = assign<ConnectivityContext, ConnectivityEvent>({
    currentReconnectionDelayMs: (context) => {
        let delayMs = context.currentReconnectionDelayMs * RECONNECTION_DELAY_GROW_FACTOR;
        if (delayMs > MAX_RECONNECTION_DELAY_MS) {
            delayMs = MAX_RECONNECTION_DELAY_MS;
        }
        return delayMs;
    },
});

/**
 * Resets {@link ConnectivityContext} to default values.
 */
const resetOnSuccessfulConnection = assign<ConnectivityContext, ConnectivityEvent>({
    ...CONNECTIVITY_CONTEXT_DEFAULTS,
});

/**
 * FSM actions config.
 */
export const connectivityActions = {
    [ConnectivityActionType.TurnOnProxy]: turnOnProxy,
    [ConnectivityActionType.TurnOffProxy]: turnOffProxy,
    [ConnectivityActionType.RetryConnection]: retryConnection,
    [ConnectivityActionType.SetTimeSinceLastRetryWithRefreshMs]: setTimeSinceLastRetryWithRefreshMs,
    [ConnectivityActionType.IncrementRetryCount]: incrementRetryCount,
    [ConnectivityActionType.IncrementDelay]: incrementDelay,
    [ConnectivityActionType.ResetOnSuccessfulConnection]: resetOnSuccessfulConnection,
};
