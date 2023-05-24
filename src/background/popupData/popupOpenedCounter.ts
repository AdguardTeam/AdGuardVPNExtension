import { sessionState } from '../stateStorage/stateStorage.abstract';
import { PopupOpenedCounterState, StorageKey } from '../schema';

interface PopupOpenedCounterInterface {
    init(): void;
    increment(): void;
}

/**
 * Class to store the count how many times a browser extension's popup has been opened.
 */
class PopupOpenedCounter implements PopupOpenedCounterInterface {
    state: PopupOpenedCounterState;

    public get count(): number {
        return this.state.count;
    }

    private set count(value: number) {
        this.state.count = value;
        sessionState.setItem(StorageKey.PopupOpenedCounter, this.state);
    }

    /**
     * Increases the count of popup openings
     */
    public increment(): void {
        this.count += 1;
    }

    public init(): void {
        this.state = sessionState.getItem(StorageKey.PopupOpenedCounter);
    }
}

export const popupOpenedCounter = new PopupOpenedCounter();
