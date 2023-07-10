import { stateStorage } from '../stateStorage';
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
        stateStorage.setItem(StorageKey.PopupOpenedCounter, this.state);
    }

    /**
     * Increases the count of popup openings
     */
    public increment(): void {
        this.count += 1;
    }

    public init(): void {
        this.state = stateStorage.getItem(StorageKey.PopupOpenedCounter);
    }
}

export const popupOpenedCounter = new PopupOpenedCounter();
