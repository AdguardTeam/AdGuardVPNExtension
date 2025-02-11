import { notifier } from '../common/notifier';
import { SETTINGS_IDS } from '../common/constants';

import { browserApi } from './browserApi';
import { settings } from './settings';
import { ConnectivityStateType } from './schema';

/**
 * Data passed by connectivity state change event.
 */
interface StateType {
    /**
     * New connectivity state type.
     */
    value: ConnectivityStateType;
}

/**
 * Status of rate modal.
 */
enum RateModalStatus {
    /**
     * Rate modal has not been shown yet.
     */
    Initial = 'initial',

    /**
     * User has closed rate modal without rating.
     */
    Hidden = 'hidden',

    /**
     * User has rated.
     */
    Rated = 'rated',
}

/**
 * Rate modal state.
 */
interface RateModalState {
    /**
     * Number of success connections.
     */
    connections: number;

    /**
     * Current status of rate modal.
     */
    status: RateModalStatus;
}

/**
 * Rate modal service interface.
 */
export interface RateModalInterface {
    /**
     * Initializes rate modal service.
     */
    initState(): Promise<void>;

    /**
     * Hides rate modal after user closes it without rating.
     * Updates rate modal status to hided and resets connections count.
     */
    hideAfterCancel(): Promise<void>;

    /**
     * Hides rate modal after user rates.
     * Updates rate modal status to rated.
     */
    hideAfterRate(): Promise<void>;

    /**
     * Checks if rate modal should be shown.
     *
     * @returns True if rate modal should be shown, false otherwise.
     */
    shouldShowRateModal(): Promise<boolean>;
}

/**
 * Rate modal service.
 *
 * Handles rate modal display.
 * Shows rate modal after 3rd successful connection after installation.
 * And after every 30th successful connection after closing rate modal without rating.
 *
 * Flow of state:
 * 1) After installation state: status = Initial, connections = 0
 * 2) After 3rd successful connection: status = Initial, connections = 3
 *    Notify listeners to show rate modal.
 * 3.1) If user closes rate modal without rating or with bad rating: status = Hidden, connections = 3
 *      Goes to step 4.
 * 3.2) If user rates: status = Rated, connections = 3
 *      After that, rate modal will not be shown anymore.
 * 4) After 30th successful connection: status = Hidden, connections = 30
 *    Notify listeners to show rate modal.
 * 5.1) If user closes rate modal without rating or with bad rating: status = Hidden, connections = 0
 *      Repeats step 4 until 5.2 happens.
 * 5.2) If user rates: status = Rated, connections = 30
 *      After that, rate modal will not be shown anymore.
 */
class RateModal implements RateModalInterface {
    /**
     * Key for open rate modal state in browser local storage.
     */
    private static readonly OPEN_RATE_MODAL_STATE_KEY = 'open.rate.modal.state';

    /**
     * Number of connections to show rate modal after installation.
     */
    private static readonly CONNECTIONS_TO_SHOW_AFTER_INSTALL = 3;

    /**
     * Number of connections to show rate modal after closing without rating.
     */
    private static readonly CONNECTIONS_TO_SHOW_AFTER_HIDE = 30;

    /**
     * Default rate modal state.
     */
    private static readonly DEFAULT_STATE: RateModalState = {
        connections: 0,
        status: RateModalStatus.Initial,
    };

    /**
     * Current rate modal state.
     *
     * Initialized in {@link init} method.
     */
    private state!: RateModalState;

    /**
     * Listener ID for connectivity state change event.
     */
    private listenerId: string | null = null;

    /**
     * Initializes rate modal service.
     */
    public initState = async (): Promise<void> => {
        const state = await browserApi.storage.get<RateModalState>(RateModal.OPEN_RATE_MODAL_STATE_KEY);

        if (state) {
            this.state = state;
        } else {
            this.state = RateModal.DEFAULT_STATE;
            await this.saveState(RateModal.DEFAULT_STATE);
        }

        // Do not attach listener if already rated or rate show setting is disabled
        const shouldRateShowSetting = settings.getSetting(SETTINGS_IDS.RATE_SHOW);
        if (this.state.status !== RateModalStatus.Rated && shouldRateShowSetting) {
            this.listenerId = notifier.addSpecifiedListener(
                notifier.types.CONNECTIVITY_STATE_CHANGED,
                this.handleConnectivityStateChange.bind(this),
            );
        }
    };

    /**
     * Removes event listener.
     */
    private removeListener(): void {
        if (this.listenerId) {
            notifier.removeListener(this.listenerId);
            this.listenerId = null;
        }
    }

    /**
     * Saves rate modal state to browser storage.
     *
     * @param state New state to save.
     */
    private async saveState(state: RateModalState): Promise<void> {
        browserApi.storage.set(RateModal.OPEN_RATE_MODAL_STATE_KEY, state);
    }

    /**
     * Updates rate modal state and saves it to browser storage.
     *
     * @param state Partial state to update.
     */
    private async updateState(state: Partial<RateModalState>): Promise<void> {
        this.state = { ...this.state, ...state };
        await this.saveState(this.state);
    }

    /**
     * Handles connectivity state change.
     *
     * @param state New connectivity state.
     */
    private async handleConnectivityStateChange(state: StateType): Promise<void> {
        // If not connected, do nothing
        if (state.value !== ConnectivityStateType.Connected) {
            return;
        }

        // If rate show setting is disabled do not handle change state and delete listener
        const shouldRateShowSetting = settings.getSetting(SETTINGS_IDS.RATE_SHOW);
        if (!shouldRateShowSetting) {
            this.removeListener();
            return;
        }

        await this.updateState({
            connections: this.state.connections + 1,
        });

        const shouldShow = await this.shouldShowRateModal();
        if (shouldShow) {
            notifier.notifyListeners(notifier.types.SHOW_RATE_MODAL);
        }
    }

    /**
     * Hides rate modal after user closes it without rating.
     * Updates rate modal status to hided and resets connections count.
     */
    public hideAfterCancel = async (): Promise<void> => {
        // If already rated, do not update state
        if (this.state.status === RateModalStatus.Rated) {
            return;
        }

        // Reset connections only if status was hidden
        const shouldResetConnections = this.state.status === RateModalStatus.Hidden;

        await this.updateState({
            status: RateModalStatus.Hidden,
            connections: shouldResetConnections ? 0 : this.state.connections,
        });
    };

    /**
     * Hides rate modal after user rates.
     * Updates rate modal status to rated.
     */
    public hideAfterRate = async (): Promise<void> => {
        // If already rated, do not update state
        if (this.state.status === RateModalStatus.Rated) {
            return;
        }

        // We need to update only status to 'rated'
        await this.updateState({ status: RateModalStatus.Rated });

        // Remove listener after rating
        this.removeListener();
    };

    /**
     * Checks if rate modal should be shown.
     *
     * @returns True if rate modal should be shown, false otherwise.
     */
    public shouldShowRateModal = async (): Promise<boolean> => {
        // Check if rate show setting is enabled
        const shouldRateShowSetting = settings.getSetting(SETTINGS_IDS.RATE_SHOW);
        if (!shouldRateShowSetting) {
            return false;
        }

        // If already rated, do not show rate modal
        if (this.state.status === RateModalStatus.Rated) {
            return false;
        }

        // If rate modal has not been shown yet, show it after 3rd connection
        if (this.state.status === RateModalStatus.Initial) {
            return this.state.connections >= RateModal.CONNECTIONS_TO_SHOW_AFTER_INSTALL;
        }

        // If user has closed rate modal without rating, show it after 30th connection
        if (this.state.status === RateModalStatus.Hidden) {
            return this.state.connections >= RateModal.CONNECTIONS_TO_SHOW_AFTER_HIDE;
        }

        return false;
    };
}

export const rateModal = new RateModal();
