import { ExclusionsMode, ExclusionState } from '../../../common/exclusionsConstants';
import { notifier } from '../../../common/notifier';
import { log } from '../../../common/logger';
import { settings } from '../../settings';
import { proxy } from '../../proxy';
import { type PersistedExclusions, type ExclusionInterface, type IndexedExclusionsInterface } from '../../schema';

import { ExclusionsHandler } from './ExclusionsHandler';

export type AllExclusions = Omit<PersistedExclusions, 'inverted'>;

/**
 * Interface representing handlers for different exclusion modes.
 */
export interface ExclusionsHandlers {
    /**
     * Regular mode exclusions handler.
     */
    regularModeHandler: ExclusionsHandler;

    /**
     * Selective mode exclusions handler.
     */
    selectiveModeHandler: ExclusionsHandler;

    /**
     * Current mode exclusions handler.
     */
    currentModeHandler: ExclusionsHandler;
}

export class ExclusionsManager {
    /**
     * Promise that resolves when the exclusions service is initialized.
     */
    private initPromise: Promise<void> | null = null;

    /**
     * All exclusions data.
     *
     * IMPORTANT: Before accessing it make sure that the service is initialized by calling {@link init} method.
     */
    private inverted: boolean;

    /**
     * Current mode exclusions handler.
     *
     * IMPORTANT: Before accessing it make sure that the service is initialized by calling {@link init} method.
     */
    private currentModeHandler: ExclusionsHandler;

    /**
     * Selective mode exclusions handler.
     *
     * IMPORTANT: Before accessing it make sure that the service is initialized by calling {@link init} method.
     */
    private selectiveModeHandler: ExclusionsHandler;

    /**
     * Regular mode exclusions handler.
     *
     * IMPORTANT: Before accessing it make sure that the service is initialized by calling {@link init} method.
     */
    private regularModeHandler: ExclusionsHandler;

    /**
     * Initializes the exclusions manager service by creating exclusions handlers.
     */
    private async innerInit(): Promise<void> {
        const exclusions = settings.getExclusions();
        this.inverted = exclusions.inverted ?? false;

        const selective = exclusions[ExclusionsMode.Selective] ?? [];
        this.selectiveModeHandler = new ExclusionsHandler(
            this.handleHandlerUpdate.bind(this),
            selective,
            ExclusionsMode.Selective,
        );

        const regular = exclusions[ExclusionsMode.Regular] ?? [];
        this.regularModeHandler = new ExclusionsHandler(
            this.handleHandlerUpdate.bind(this),
            regular,
            ExclusionsMode.Regular,
        );

        this.currentModeHandler = this.inverted
            ? this.selectiveModeHandler
            : this.regularModeHandler;

        /**
         * Update the bypass list in the proxy with the current exclusions.
         *
         * Note: We do not await {@link init} here, because we are inside of it.
         */
        await this.handleExclusionsUpdate();

        log.info('[vpn.ExclusionsManager.innerInit]: ExclusionsManager is ready');
    }

    /**
     * Initializes the exclusions manager service.
     *
     * Note: You can call this method to wait for the exclusions manager service to be initialized,
     * because it was implemented as it can be called multiple times but
     * initialization will happen only once.
     *
     * @returns Promise that resolves when the exclusions manager service is initialized.
     */
    public async init(): Promise<void> {
        if (!this.initPromise) {
            this.initPromise = this.innerInit();
        }

        return this.initPromise;
    }

    /**
     * Applies enabled exclusions to proxy config and save them to local storage.
     *
     * IMPORTANT: Before calling this method make sure that the service is initialized by calling {@link init} method.
     */
    private async handleExclusionsUpdate(): Promise<void> {
        notifier.notifyListeners(notifier.types.EXCLUSIONS_UPDATED_BACK_MESSAGE);

        const enabledExclusionsList = this.currentModeHandler.exclusions
            .filter(({ state }) => state === ExclusionState.Enabled)
            .map(({ hostname }) => hostname);

        await proxy.setBypassList(enabledExclusionsList, this.inverted);

        const exclusionsRepository = {
            inverted: this.inverted,
            [ExclusionsMode.Selective]: this.selectiveModeHandler.exclusions,
            [ExclusionsMode.Regular]: this.regularModeHandler.exclusions,
        };

        settings.setExclusions(exclusionsRepository);
    }

    /**
     * Handles updates from exclusions handlers.
     */
    private async handleHandlerUpdate(): Promise<void> {
        // Await initialization if not yet initialized
        await this.init();

        await this.handleExclusionsUpdate();
    }

    /**
     * Retrieves all mode handlers after ensuring the service is initialized.
     *
     * @returns Object containing instances of {@link ExclusionsHandler} for regular, selective, and current modes.
     */
    public async getModeHandlers(): Promise<ExclusionsHandlers> {
        // Await initialization if not yet initialized
        await this.init();

        return {
            regularModeHandler: this.regularModeHandler,
            selectiveModeHandler: this.selectiveModeHandler,
            currentModeHandler: this.currentModeHandler,
        };
    }

    /**
     * Checks if the current exclusion mode is inverted (selective).
     *
     * @returns True if the current mode is inverted (selective), false otherwise (regular).
     */
    public async isInverted(): Promise<boolean> {
        // Await initialization if not yet initialized
        await this.init();

        return this.inverted;
    }

    /**
     * Sets current exclusion mode.
     *
     * @param mode New mode to set.
     */
    public async setCurrentMode(mode: ExclusionsMode): Promise<void> {
        // Await initialization if not yet initialized
        await this.init();

        switch (mode) {
            case ExclusionsMode.Selective: {
                this.currentModeHandler = this.selectiveModeHandler;
                this.inverted = true;
                break;
            }
            case ExclusionsMode.Regular: {
                this.currentModeHandler = this.regularModeHandler;
                this.inverted = false;
                break;
            }
            default:
                throw Error(`Wrong type received ${mode}`);
        }

        await this.handleExclusionsUpdate();
    }

    /**
     * Retrieves exclusions for current mode.
     *
     * @returns Array of exclusions for current mode.
     */
    public async getExclusions(): Promise<ExclusionInterface[]> {
        // Await initialization if not yet initialized
        await this.init();

        return this.currentModeHandler.exclusions;
    }

    /**
     * Gets exclusions for both modes.
     *
     * @returns exclusions for both modes
     */
    public async getAllExclusions(): Promise<AllExclusions> {
        // Await initialization if not yet initialized
        await this.init();

        return {
            regular: [...this.regularModeHandler.exclusions],
            selective: [...this.selectiveModeHandler.exclusions],
        };
    }

    /**
     * Sets exclusions to both mode handlers.
     *
     * @param allExclusions Exclusions for both modes to set.
     */
    public async setAllExclusions(allExclusions: AllExclusions): Promise<void> {
        // Await initialization if not yet initialized
        await this.init();

        const { regular, selective } = allExclusions;
        await this.regularModeHandler.setExclusions(regular);
        await this.selectiveModeHandler.setExclusions(selective);
    }

    /**
     * Retrieves indexed exclusions for current mode.
     *
     * @returns Indexed exclusions for current mode.
     */
    public async getIndexedExclusions(): Promise<IndexedExclusionsInterface> {
        // Await initialization if not yet initialized
        await this.init();

        return this.currentModeHandler.getIndexedExclusions();
    }
}

export const exclusionsManager = new ExclusionsManager();
