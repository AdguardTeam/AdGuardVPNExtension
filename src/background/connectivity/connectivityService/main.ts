import type { EventData } from 'xstate';

import { notifier } from '../../../common/notifier';
import { log } from '../../../common/logger';
import { StateData } from '../../stateStorage';
import { StorageKey, ConnectivityStateType } from '../../schema';

import { createConnectivityMachine, ConnectivityEventType, createConnectivityInterpreter } from './fsm';

type ConnectivityInterpreter = ReturnType<typeof createConnectivityInterpreter>;

type ConnectivityFsmState = Parameters<NonNullable<Parameters<ConnectivityInterpreter['subscribe']>[0]>>[0];

/**
 * Connectivity state change event type.
 */
export interface ConnectivityStateChangeEvent {
    /**
     * New connectivity state type.
     */
    value: ConnectivityStateType;

    /**
     * Event type.
     */
    event: ConnectivityEventType;
}

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
    public get state(): ConnectivityFsmState {
        return this.interpreter.getSnapshot();
    }

    /**
     * Connectivity service state data.
     * Used to save and retrieve connectivity state from session storage,
     * in order to persist it across service worker restarts.
     */
    private connectivityState = new StateData(StorageKey.ConnectivityData);

    constructor() {
        this.handleStateChange = this.handleStateChange.bind(this);
    }

    /**
     * Creates and starts new {@link interpreter} with state and context from {@link stateStorage}.
     */
    public async start(): Promise<void> {
        const { context, state } = await this.connectivityState.get();

        const fsm = createConnectivityMachine(context);

        this.interpreter = createConnectivityInterpreter(fsm);

        this.interpreter.start(state);

        log.debug(`Current state: ${this.state.value}`);

        this.interpreter.subscribe(this.handleStateChange);

        /**
         * Restore the websocket connection after the service
         * worker wakes up, because fsm state is not persisted.
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
    private async handleStateChange(state: ConnectivityFsmState): Promise<void> {
        log.debug(`Event type: ${state.event.type}`);

        if (state.changed) {
            log.debug(`Current state: ${state.value}`);

            // Emit event to listeners
            const event: ConnectivityStateChangeEvent = {
                value: state.value as ConnectivityStateType,
                event: state.event.type as ConnectivityEventType,
            };
            notifier.notifyListeners(notifier.types.CONNECTIVITY_STATE_CHANGED, event);

            // Update state in storage
            await this.connectivityState.set({
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
    public send(event: ConnectivityEventType, data?: EventData): void {
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
