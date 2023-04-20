interface PopupOpenedCounterInterface {
    count: number;
    increase(): void;
}

/**
 * Class to store the count how many times a browser extension's popup has been opened.
 */
class PopupOpenedCounter implements PopupOpenedCounterInterface {
    private popupOpenedCount: number = 0;

    /**
     * Gets the count of popup openings
     */
    get count(): number {
        return this.popupOpenedCount;
    }

    /**
     * Increases the count of popup openings
     */
    increase(): void {
        this.popupOpenedCount += 1;
    }
}

export const popupOpenedCounter = new PopupOpenedCounter();
