import { type Notifier } from '../../common/notifier';
import { SETTINGS_IDS } from '../../common/constants';
import { ConnectivityStateType } from '../schema';
import { type SettingsInterface } from '../settings/settings';
import { type StorageInterface } from '../browserApi/storage';

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
export enum RateModalStatus {
    /**
     * Rate modal has not been shown yet.
     * Modal should be shown after 3rd successful connection.
     */
    Initial = 'initial',

    /**
     * User has closed rate modal without rating or with bad rating after 3rd successful connection.
     * Modal should be shown after 30th successful connection.
     */
    Hidden = 'hidden',

    /**
     * Either:
     * - User has rated with good rating after 3rd / 30th successful connection.
     * - User has closed rate modal without rating or with bad rating after 30th successful connection.
     *
     * Modal should not be shown anymore.
     */
    Finished = 'finished',
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
     * Hides rate modal after user closes it without rating or with bad rating.
     * Updates rate modal status to hided / finished.
     */
    hideAfterCancel(): Promise<void>;

    /**
     * Hides rate modal after user rates.
     * Updates rate modal status to finished.
     */
    hideAfterRate(): Promise<void>;

    /**
     * Checks if rate modal should be shown.
     *
     * @returns True if rate modal should be shown, false otherwise.
     */
    shouldShowRateModal(): boolean;
}

/**
 * Constructor parameters for {@link RateModal}.
 */
export interface RateModalParameters {
    /**
     * Browser local storage.
     */
    storage: StorageInterface;

    /**
     * Settings service.
     */
    settings: SettingsInterface;

    /**
     * Notifier service.
     */
    notifier: Notifier;
}

/**
 * Rate modal service.
 * Handles rate modal display.
 *
 * Flow of state:
 * 1) After installation state: status = Initial, connections = 0
 * 2) After 3rd successful connection: status = Initial, connections = 3
 *    Notify listeners to show rate modal.
 * 3.1) If user closes rate modal without rating or rates with bad rating: status = Hidden, connections = 3
 *      Goes to step 4.
 * 3.2) If user rates with good rating: status = Finished, connections = 3
 *      After that, rate modal will not be shown anymore.
 * 4) After 30th successful connection: status = Hidden, connections = 30
 *    Notify listeners to show rate modal.
 * 5.1) If user closes rate modal without rating or rates with bad rating: status = Finished, connections = 30
 *      After that, rate modal will not be shown anymore.
 * 5.2) If user rates with good rating: status = Finished, connections = 30
 *      After that, rate modal will not be shown anymore.
 *
 * Bad rating: 1-3 stars
 * Good rating: 4-5 stars
 */
export class RateModal implements RateModalInterface {
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
     * Browser local storage.
     */
    private storage: StorageInterface;

    /**
     * Settings service.
     */
    private settings: SettingsInterface;

    /**
     * Notifier service.
     */
    private notifier: Notifier;

    /**
     * Current rate modal state.
     *
     * Initialized in {@link init} method.
     */
    private state: RateModalState = RateModal.DEFAULT_STATE;

    /**
     * Listener ID for connectivity state change event.
     */
    private listenerId: string | null = null;

    /**
     * Constructor.
     */
    constructor({
        storage,
        settings,
        notifier,
    }: RateModalParameters) {
        this.storage = storage;
        this.settings = settings;
        this.notifier = notifier;
    }

    /**
     * Is show rate setting enabled.
     *
     * @returns True if setting is enabled, false otherwise.
     */
    private isShowRateSettingEnabled(): boolean {
        return this.settings.getSetting(SETTINGS_IDS.RATE_SHOW);
    }

    /**
     * Initializes rate modal service.
     */
    public initState = async (): Promise<void> => {
        const state = await this.storage.get<RateModalState>(RateModal.OPEN_RATE_MODAL_STATE_KEY);

        if (state) {
            this.state = state;
        } else {
            // If state is not found in storage, save default state to storage
            await this.updateState(RateModal.DEFAULT_STATE);
        }

        // Attach listener only if flow is not finished and setting enabled
        if (this.state.status !== RateModalStatus.Finished && this.isShowRateSettingEnabled()) {
            this.listenerId = this.notifier.addSpecifiedListener(
                this.notifier.types.CONNECTIVITY_STATE_CHANGED,
                this.handleConnectivityStateChange.bind(this),
            );
        }
    };

    /**
     * Removes event listener.
     */
    private removeListener(): void {
        if (this.listenerId) {
            this.notifier.removeListener(this.listenerId);
            this.listenerId = null;
        }
    }

    /**
     * Updates rate modal state and saves it to browser storage.
     *
     * @param state Partial state to update.
     */
    private async updateState(state: Partial<RateModalState>): Promise<void> {
        this.state = { ...this.state, ...state };
        await this.storage.set(RateModal.OPEN_RATE_MODAL_STATE_KEY, this.state);
    }

    /**
     * Handles connectivity state change.
     *
     * @param state New connectivity state.
     */
    private async handleConnectivityStateChange(state: StateType): Promise<void> {
        // If rate show setting is disabled do not handle change state and delete listener
        if (!this.isShowRateSettingEnabled()) {
            this.removeListener();
            return;
        }

        // If not connected, do nothing
        if (state.value !== ConnectivityStateType.Connected) {
            return;
        }

        await this.updateState({
            connections: this.state.connections + 1,
        });

        if (this.shouldShowRateModal()) {
            this.notifier.notifyListeners(this.notifier.types.SHOW_RATE_MODAL);
        }
    }

    /**
     * Hides rate modal after user closes it without rating or with bad rating.
     * Updates rate modal status to hided / finished.
     */
    public hideAfterCancel = async (): Promise<void> => {
        // If flow is finished, do not update state
        if (this.state.status === RateModalStatus.Finished) {
            return;
        }

        if (this.state.status === RateModalStatus.Initial) {
            // Step 3.1. If user closes rate modal without rating or rates with bad rating
            this.updateState({ status: RateModalStatus.Hidden });
        } else {
            // Step 5.1. If user closes rate modal without rating or rates with bad rating
            this.updateState({ status: RateModalStatus.Finished });

            // Remove listener because rate modal will not be shown anymore
            this.removeListener();
        }
    };

    /**
     * Hides rate modal after user rates.
     * Updates rate modal status to finished.
     */
    public hideAfterRate = async (): Promise<void> => {
        // If flow is finished, do not update state
        if (this.state.status === RateModalStatus.Finished) {
            return;
        }

        // Step 3.2 / 5.2. We need to update only status to Finished
        await this.updateState({ status: RateModalStatus.Finished });

        // Remove listener after rating
        this.removeListener();
    };

    /**
     * Checks if rate modal should be shown.
     *
     * @returns True if rate modal should be shown, false otherwise.
     */
    public shouldShowRateModal = (): boolean => {
        // Check if rate show setting is enabled
        if (!this.isShowRateSettingEnabled()) {
            return false;
        }

        // If flow is finished, do not show rate modal
        if (this.state.status === RateModalStatus.Finished) {
            return false;
        }

        // Step 2. If rate modal has not been shown yet, show it after 3rd connection
        if (this.state.status === RateModalStatus.Initial) {
            return this.state.connections >= RateModal.CONNECTIONS_TO_SHOW_AFTER_INSTALL;
        }

        // Step 4. If user has closed rate modal without rating, show it after 30th connection
        if (this.state.status === RateModalStatus.Hidden) {
            return this.state.connections >= RateModal.CONNECTIONS_TO_SHOW_AFTER_HIDE;
        }

        return false;
    };
}
