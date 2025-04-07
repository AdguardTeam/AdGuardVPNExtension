import type { EventData } from 'xstate';

import { notifier } from '../../../common/notifier';
import { log } from '../../../common/logger';
import { stateStorage } from '../../stateStorage';
import { StorageKey, type ConnectivityData, ConnectivityStateType } from '../../schema';

import { createConnectivityMachine, ConnectivityEventType, createConnectivityInterpreter } from './fsm';

type ConnectivityInterpreter = ReturnType<typeof createConnectivityInterpreter>;

type ConnectivityFsmState = Parameters<NonNullable<Parameters<ConnectivityInterpreter['subscribe']>[0]>>[0];

// TODO: use custom interpreter instead wrapper
/**
 * This service manages connectivity via xstate FSM.
 */
export class ConnectivityService {
    #interpreter: ConnectivityInterpreter | undefined;

    /**
     * Interpreter for FSM.
     */
    public get interpreter(): ConnectivityInterpreter {
        if (!this.#interpreter) {
            throw new Error('Connectivity interpreter is not initialized');
        }

        return this.#interpreter;
    }

    public set interpreter(interpreter: ConnectivityInterpreter) {
        this.#interpreter = interpreter;
    }

    /**
     * Current state of FSM.
     */
    public get state() {
        return this.interpreter.getSnapshot();
    }

    constructor() {
        this.handleStateChange = this.handleStateChange.bind(this);
    }

    /**
     * Creates and starts new {@link interpreter} with state and context from {@link stateStorage}.
     */
    public start() {
        const { context, state } = stateStorage.getItem<ConnectivityData>(StorageKey.ConnectivityData);

        const fsm = createConnectivityMachine(context);

        this.interpreter = createConnectivityInterpreter(fsm);

        this.interpreter.start(state);

        log.debug(`Current state: ${this.state.value}`);

        this.interpreter.subscribe(this.handleStateChange);

        /**
         * Restore the websocket connection after the service worker wakes up.
         * Note: this condition only works for the mv3 version, as the fsm state is not persisted in mv2.
         */
        if (this.isVPNConnected()) {
            this.send(ConnectivityEventType.WsClose);
        }
    }

    /**
     * Notifies listeners and updates {@link stateStorage} on FSM state change.
     *
     * @param state New state of connectivity FSM.
     */
    private handleStateChange(state: ConnectivityFsmState) {
        log.debug(`Event type: ${state.event.type}`);

        if (state.changed) {
            log.debug(`Current state: ${state.value}`);
            notifier.notifyListeners(notifier.types.CONNECTIVITY_STATE_CHANGED, {
                value: state.value,
                event: state.event.type,
            });
            stateStorage.setItem<ConnectivityData>(StorageKey.ConnectivityData, {
                context: state.context,
                state: state.value as ConnectivityStateType,
            });
        }
    }

    /**
     * Sends event to {@link interpreter}.
     *
     * @param event Connectivity FSM event type.
     * @param data Connectivity FSM event payload.
     */
    public send(event: ConnectivityEventType, data?: EventData) {
        this.interpreter.send(event, data);
    }

    /**
     * Checks if VPN is connected.
     *
     * @returns True if VPN is connected, false otherwise.
     */
    public isVPNConnected(): boolean {
        return this.state.matches(ConnectivityStateType.Connected);
    }

    /**
     * Checks if VPN is disconnected.
     *
     * @returns True if VPN is disconnected, false otherwise.
     */
    public isVPNDisconnectedIdle(): boolean {
        return this.state.matches(ConnectivityStateType.DisconnectedIdle);
    }

    /**
     * Checks if VPN in Idle state.
     *
     * @returns True if VPN is in Idle state, false otherwise.
     */
    public isVPNIdle(): boolean {
        return this.state.matches(ConnectivityStateType.Idle);
    }
}

/**
 * Global connectivity service instance.
 */
export const connectivityService = new ConnectivityService();
