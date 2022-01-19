import { ExclusionsModes, ExclusionState } from '../../../common/exclusionsConstants';
import { ExclusionsHandler } from './ExclusionsHandler';
import notifier from '../../../lib/notifier';
import { log } from '../../../lib/logger';
import { settings } from '../../settings';
import { proxy } from '../../proxy';
import { ExclusionInterface, IndexedExclusionsInterface } from './exclusionsTypes';

interface PersistedExclusions {
    [ExclusionsModes.Regular]: ExclusionInterface[];
    [ExclusionsModes.Selective]: ExclusionInterface[];
    inverted: boolean;
}

const DefaultExclusions: PersistedExclusions = {
    [ExclusionsModes.Regular]: [],
    [ExclusionsModes.Selective]: [],
    inverted: false,
};

export class ExclusionsManager {
    exclusions: PersistedExclusions = DefaultExclusions;

    inverted: boolean = DefaultExclusions.inverted;

    selectiveModeHandler: ExclusionsHandler;

    regularModeHandler: ExclusionsHandler;

    currentHandler: ExclusionsHandler;

    init = async () => {
        this.exclusions = settings.getExclusions() as PersistedExclusions;

        const regular = this.exclusions[ExclusionsModes.Regular] ?? [];

        const selective = this.exclusions[ExclusionsModes.Selective] ?? [];

        this.inverted = this.exclusions.inverted ?? false;

        this.selectiveModeHandler = new ExclusionsHandler(
            this.handleExclusionsUpdate,
            selective,
            ExclusionsModes.Selective,
        );

        this.regularModeHandler = new ExclusionsHandler(
            this.handleExclusionsUpdate,
            regular,
            ExclusionsModes.Regular,
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

        const enabledExclusionsList = this.currentHandler.getExclusions()
            .filter(({ state }) => state === ExclusionState.Enabled)
            .map(({ hostname }) => hostname);

        await proxy.setBypassList(enabledExclusionsList, this.inverted);

        const exclusionsRepository = {
            inverted: this.inverted,
            [ExclusionsModes.Selective]: this.selective.exclusions,
            [ExclusionsModes.Regular]: this.regular.exclusions,
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
    async setCurrentMode(mode: ExclusionsModes) {
        switch (mode) {
            case ExclusionsModes.Selective: {
                this.currentHandler = this.selectiveModeHandler;
                this.inverted = true;
                break;
            }
            case ExclusionsModes.Regular: {
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
        return this.currentHandler.getExclusions();
    }

    /**
     * Returns indexed exclusions for current mode
     */
    getIndexedExclusions(): IndexedExclusionsInterface {
        return this.currentHandler.getIndexedExclusions();
    }
}

export const exclusionsManager = new ExclusionsManager();
