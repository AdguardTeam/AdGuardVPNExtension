import { Machine, interpret, assign } from 'xstate';
import notifier from '../../../lib/notifier';
import { STATE, EVENT } from './connectivityConstants';
import log from '../../../lib/logger';
// eslint-disable-next-line import/no-cycle
import { switcher } from '../switcher';

const MIN_RECONNECTION_DELAY_MS = 1000; // 1 second
const MAX_RECONNECTION_DELAY_MS = 1000 * 60 * 3; // 3 minutes
const RECONNECTION_DELAY_GROW_FACTOR = 1.3;
const RETRY_CONNECTION_TIME_MS = 70000; // 70 seconds

const actions = {
    turnOnProxy: async () => {
        try {
            await switcher.turnOn();
        } catch (e) {
            log.debug(e);
        }
    },
    turnOffProxy: async () => {
        try {
            await switcher.turnOff();
        } catch (e) {
            log.debug(e);
        }
    },
    /**
     * After 70 seconds of fruitless reconnection attempts to previously selected endpoint we
     *      1. re-fetch tokens, vpn info and locations list from the backend
     *      2. choose endpoint once again (it's possible that the one that previously failed
     *          is already excluded from the list)
     *      3. retrying connection attempts (probably to another endpoint)

     * Why 70 seconds:
     * There are 2 possible kinds of failures:
     *      1. short term (OOM & restart, deployment of a new version)
     *      2. long term (server dead or brought down intentionally)
     * We don't want our users rambling between endpoints and overloading them when (1) occurs,
     * so we bring in 70 seconds threshold after which we treat the unavailability as (2)
     * and try find another one (backend probably has alternatives in this case).
     */
    retryConnection: async (context) => {
        if (context.timeSinceRetriesStartedMs > RETRY_CONNECTION_TIME_MS
            && !context.retriedConnectToOtherEndpoint) {
            // retry to connect after tokens, VPN info, locations refresh
            await switcher.retryTurnOn(true);
            // eslint-disable-next-line no-param-reassign
            context.retriedConnectToOtherEndpoint = true;
        } else {
            // Retries to connect to ws without cache refresh
            await switcher.retryTurnOn();
        }
    },
};

/**
 * Resets context information
 * Description of every property could be found in the context section description
 */
const resetOnSuccessfulConnection = assign({
    currentReconnectionDelayMs: MIN_RECONNECTION_DELAY_MS,
    retryCount: 0,
    retriedConnectToOtherEndpoint: false,
    timeSinceRetriesStartedMs: 0,
});

/**
 * Action, which increments count of connection retries and time passed since first retry
 */
const incrementRetryCount = assign({
    retryCount: (context) => {
        return context.retryCount + 1;
    },
    timeSinceRetriesStartedMs: (context) => {
        return context.timeSinceRetriesStartedMs + context.currentReconnectionDelayMs;
    },
});

/**
 * Action, which increases delay between reconnection
 */
const incrementDelay = assign({
    currentReconnectionDelayMs: (context) => {
        let delayMs = context.currentReconnectionDelayMs * RECONNECTION_DELAY_GROW_FACTOR;
        if (delayMs > MAX_RECONNECTION_DELAY_MS) {
            delayMs = MAX_RECONNECTION_DELAY_MS;
        }
        return delayMs;
    },
});

const delays = {
    RETRY_DELAY: (context) => {
        return context.currentReconnectionDelayMs;
    },
};

/**
 * Finite state machine used to manage websocket connectivity states
 * Transitions react only to the described events, all other events are ignored
 */
const connectivityFSM = new Machine({
    id: 'connectivity',
    context: {
        /**
         * Count of connections retries
         */
        retryCount: 0,
        /**
         * Time in ms since reconnections started
         */
        timeSinceRetriesStartedMs: 0,
        /**
         * Property used to keep growing delay between reconnections
         */
        currentReconnectionDelayMs: MIN_RECONNECTION_DELAY_MS,
        /**
         * Flag used to reconnect to another endpoint of current location
         */
        retriedConnectToOtherEndpoint: false,
    },
    initial: STATE.DISCONNECTED_IDLE,
    states: {
        [STATE.DISCONNECTED_IDLE]: {
            entry: ['turnOffProxy'],
            on: {
                [EVENT.CONNECT_BTN_PRESSED]: STATE.CONNECTING_IDLE,
                [EVENT.CONNECT_SETTINGS_APPLY]: STATE.CONNECTING_IDLE,
            },
        },
        [STATE.DISCONNECTED_RETRYING]: {
            on: {
                [EVENT.CONNECT_BTN_PRESSED]: STATE.CONNECTING_RETRYING,
                [EVENT.NETWORK_ONLINE]: STATE.CONNECTING_RETRYING,
            },
            after: {
                RETRY_DELAY: STATE.CONNECTING_RETRYING,
            },
            entry: [incrementDelay],
        },
        [STATE.CONNECTING_IDLE]: {
            entry: ['turnOnProxy'],
            on: {
                [EVENT.CONNECTION_SUCCESS]: STATE.CONNECTED,
                [EVENT.CONNECTION_FAIL]: STATE.DISCONNECTED_RETRYING,
                // If ws connection didn't get handshake response
                [EVENT.WS_CLOSE]: STATE.DISCONNECTED_RETRYING,
                [EVENT.WS_ERROR]: STATE.DISCONNECTED_RETRYING,
                [EVENT.DISCONNECT_TRAFFIC_LIMIT_EXCEEDED]: STATE.DISCONNECTED_IDLE,
                [EVENT.PROXY_CONNECTION_ERROR]: STATE.DISCONNECTED_IDLE,
                // if user decided to connect to another location
                [EVENT.DISCONNECT_BTN_PRESSED]: STATE.DISCONNECTED_IDLE,
            },
        },
        [STATE.CONNECTING_RETRYING]: {
            entry: [incrementRetryCount, 'retryConnection'],
            on: {
                [EVENT.CONNECTION_SUCCESS]: STATE.CONNECTED,
                [EVENT.CONNECTION_FAIL]: STATE.DISCONNECTED_RETRYING,
                [EVENT.WS_CLOSE]: STATE.DISCONNECTED_RETRYING,
                [EVENT.WS_ERROR]: STATE.DISCONNECTED_RETRYING,
                [EVENT.DISCONNECT_TRAFFIC_LIMIT_EXCEEDED]: STATE.DISCONNECTED_IDLE,
                [EVENT.PROXY_CONNECTION_ERROR]: STATE.DISCONNECTED_IDLE,
                // if user decided to connect to another location
                [EVENT.DISCONNECT_BTN_PRESSED]: STATE.DISCONNECTED_IDLE,
            },
        },
        [STATE.CONNECTED]: {
            on: {
                [EVENT.WS_ERROR]: STATE.DISCONNECTED_RETRYING,
                [EVENT.WS_CLOSE]: STATE.DISCONNECTED_RETRYING,
                [EVENT.DISCONNECT_BTN_PRESSED]: STATE.DISCONNECTED_IDLE,
                [EVENT.DISCONNECT_TRAFFIC_LIMIT_EXCEEDED]: STATE.DISCONNECTED_IDLE,
            },
            entry: [resetOnSuccessfulConnection],
        },
    },
}, { actions, delays });

export const connectivityService = interpret(connectivityFSM)
    .start()
    .onEvent((event) => log.debug(event))
    .onTransition((state) => {
        log.debug({ currentState: state.value });
        notifier.notifyListeners(notifier.types.CONNECTIVITY_STATE_CHANGED, { value: state.value });
    });

connectivityService.start();

export const isVPNConnected = () => {
    return connectivityService.state.matches(STATE.CONNECTED);
};
