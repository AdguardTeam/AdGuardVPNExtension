import { StateData } from '../stateStorage';
import { StorageKey } from '../schema';

interface PopupOpenedCounterInterface {
    /**
     * Increases the count of popup openings
     */
    increment(): Promise<void>;

    /**
     * Retrieves the count of popup openings.
     *
     * @returns The number of times the popup has been opened.
     */
    getCount(): Promise<number>;
}

/**
 * Class to store the count how many times a browser extension's popup has been opened.
 */
class PopupOpenedCounter implements PopupOpenedCounterInterface {
    /**
     * Popup opened counter service state data.
     * Used to save and retrieve popup opened counter state from session storage,
     * in order to persist it across service worker restarts.
     */
    private popupOpenedCounterState = new StateData(StorageKey.PopupOpenedCounter);

    /** @inheritdoc */
    public async increment(): Promise<void> {
        let { count } = await this.popupOpenedCounterState.get();
        count += 1;
        await this.popupOpenedCounterState.update({ count });
    }

    /** @inheritdoc */
    public async getCount(): Promise<number> {
        const { count } = await this.popupOpenedCounterState.get();
        return count;
    }
}

export const popupOpenedCounter = new PopupOpenedCounter();
