import { ExclusionsMode, ExclusionState } from '../../../common/exclusionsConstants';
import { notifier } from '../../../common/notifier';
import { log } from '../../../common/logger';
import { settings } from '../../settings';
import { proxy } from '../../proxy';
import {
    StorageKey,
    type PersistedExclusions,
    type ExclusionInterface,
    type IndexedExclusionsInterface,
    type ExclusionsManagerState,
} from '../../schema';
import { stateStorage } from '../../stateStorage';

import { ExclusionsHandler } from './ExclusionsHandler';

export type AllExclusions = Omit<PersistedExclusions, 'inverted'>;

export class ExclusionsManager {
    state: ExclusionsManagerState;

    selectiveModeHandler: ExclusionsHandler;

    regularModeHandler: ExclusionsHandler;

    saveExclusionsManagerState = () => {
        stateStorage.setItem(StorageKey.ExclusionsManagerState, this.state);
    };

    private get exclusions(): PersistedExclusions {
        return this.state.exclusions;
    }

    private set exclusions(exclusions: PersistedExclusions) {
        this.state.exclusions = exclusions;
        this.saveExclusionsManagerState();
    }

    get inverted(): boolean {
        return this.state.inverted;
    }

    set inverted(inverted: boolean) {
        this.state.inverted = inverted;
        this.saveExclusionsManagerState();
    }

    get currentHandler(): ExclusionsHandler {
        return this.state.currentHandler;
    }

    set currentHandler(currentHandler: ExclusionsHandler) {
        this.state.currentHandler = currentHandler;
        this.saveExclusionsManagerState();
    }

    init = async () => {
        this.state = stateStorage.getItem(StorageKey.ExclusionsManagerState);

        this.exclusions = settings.getExclusions();

        const regular = this.exclusions[ExclusionsMode.Regular] ?? [];

        const selective = this.exclusions[ExclusionsMode.Selective] ?? [];

        this.inverted = this.exclusions.inverted ?? false;

        this.selectiveModeHandler = new ExclusionsHandler(
            this.handleExclusionsUpdate,
            selective,
            ExclusionsMode.Selective,
        );

        this.regularModeHandler = new ExclusionsHandler(
            this.handleExclusionsUpdate,
            regular,
            ExclusionsMode.Regular,
        );

        this.currentHandler = this.inverted ? this.selectiveModeHandler : this.regularModeHandler;

        // update bypass list in proxy on init
        await this.handleExclusionsUpdate();

        log.info('ExclusionsManager is ready');
    };

    /**
     * Applies enabled exclusions to proxy config and save them to local storage
     */
    handleExclusionsUpdate = async () => {
        notifier.notifyListeners(notifier.types.EXCLUSIONS_UPDATED_BACK_MESSAGE);

        const enabledExclusionsList = this.currentHandler.exclusions
            .filter(({ state }) => state === ExclusionState.Enabled)
            .map(({ hostname }) => hostname);

        await proxy.setBypassList(enabledExclusionsList, this.inverted);

        const exclusionsRepository = {
            inverted: this.inverted,
            [ExclusionsMode.Selective]: this.selective.exclusions,
            [ExclusionsMode.Regular]: this.regular.exclusions,
        };

        settings.setExclusions(exclusionsRepository);
    };

    get regular() {
        return this.regularModeHandler;
    }

    get selective() {
        return this.selectiveModeHandler;
    }

    get current() {
        return this.currentHandler;
    }

    /**
     * Sets current exclusion mode
     * @param mode
     */
    async setCurrentMode(mode: ExclusionsMode) {
        switch (mode) {
            case ExclusionsMode.Selective: {
                this.currentHandler = this.selectiveModeHandler;
                this.inverted = true;
                break;
            }
            case ExclusionsMode.Regular: {
                this.currentHandler = this.regularModeHandler;
                this.inverted = false;
                break;
            }
            default:
                throw Error(`Wrong type received ${mode}`);
        }
        await this.handleExclusionsUpdate();
    }

    /**
     * Returns exclusions for current mode
     */
    getExclusions(): ExclusionInterface[] {
        return this.currentHandler.exclusions;
    }

    /**
     * Returns exclusions for both modes
     */
    getAllExclusions(): AllExclusions {
        return {
            regular: [...this.regular.exclusions],
            selective: [...this.selective.exclusions],
        };
    }

    /**
     * Sets exclusions to both mode handlers
     * @param allExclusions
     */
    async setAllExclusions(allExclusions: AllExclusions) {
        const { regular, selective } = allExclusions;

        await this.regular.setExclusions(regular);
        await this.selective.setExclusions(selective);
    }

    /**
     * Sets exclusions to current mode handler
     */
    setExclusions(exclusions: ExclusionInterface[]): Promise<void> {
        return this.currentHandler.setExclusions(exclusions);
    }

    /**
     * Returns indexed exclusions for current mode
     */
    getIndexedExclusions(): IndexedExclusionsInterface {
        return this.currentHandler.getIndexedExclusions();
    }
}

export const exclusionsManager = new ExclusionsManager();
