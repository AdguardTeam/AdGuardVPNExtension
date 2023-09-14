import { browserApi } from './browserApi';
import { notifier } from '../lib/notifier';
import { popupOpenedCounter } from './popupData/popupOpenedCounter';

const HINT_POPUP_COUNTDOWN_KEY = 'hint.popup.countdown';

const TEST_KEY = 'adguard.test.mode';

const HINT_POPUP_DELAY = 1000 * 60 * 60; // 1 hour
const HINT_POPUP_TEST_DELAY = 1000 * 60; // 1 min

const POPUP_OPENED_COUNT_TO_SHOW_HINT = 4;

interface HintPopupInterface {
    shouldShowHintPopup: () => Promise<boolean>;
    setViewed: () => Promise<void>;
}

/**
 * Handles hint popup display.
 * Sets time of first login to browser storage and handles it to show hint popup after 30 min.
 * After hint popup has been shown, sets null instead of login time.
 */
class HintPopup implements HintPopupInterface {
    constructor() {
        notifier.addSpecifiedListener(
            notifier.types.USER_AUTHENTICATED,
            this.handleLoginTime,
        );
    }

    /**
     * Gets login time from browser storage
     */
    private getLoginTime = async (): Promise<number | null | undefined> => {
        return browserApi.storage.get(HINT_POPUP_COUNTDOWN_KEY);
    };

    /**
     * Sets login time to browser storage
     * @param value
     */
    private setLoginTime = async (value: number | null): Promise<void> => {
        await browserApi.storage.set(HINT_POPUP_COUNTDOWN_KEY, value);
    };

    private handleLoginTime = async (): Promise<void> => {
        const loginTime = await this.getLoginTime();

        if (loginTime === null) {
            // null means that hint popup has been shown already
            return;
        }

        if (loginTime === undefined) {
            const currentTime = Date.now();
            await this.setLoginTime(currentTime);
        }
    };

    /**
     * Sets login time to null to indicate hint popup has been shown already
     */
    public setViewed = async (): Promise<void> => {
        await this.setLoginTime(null);
    };

    /**
     * Checks the conditions to show hint popup:
     * 1. 1 hour passed since login time
     * 2. user had opened popup 4 times
     * If testing flag is present in localstorage, 1-hour delay decreased to 1 minute
     */
    public shouldShowHintPopup = async (): Promise<boolean> => {
        const isTesting = await browserApi.storage.get(TEST_KEY);
        const hintPopupDelay = isTesting ? HINT_POPUP_TEST_DELAY : HINT_POPUP_DELAY;

        const loginTime = await this.getLoginTime();
        return !!(loginTime && (loginTime + hintPopupDelay <= Date.now()))
            // add 1 to popupOpenedNum because shouldShowHintPopup called for next popup opening
            && popupOpenedCounter.count + 1 >= POPUP_OPENED_COUNT_TO_SHOW_HINT;
    };
}

export const hintPopup = new HintPopup();
