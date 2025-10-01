import { notifier } from '../common/notifier';
import { ExclusionsMode } from '../common/exclusionsConstants';

import { browserApi } from './browserApi';
import { exclusions } from './exclusions';
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
     * Gets login time from browser storage.
     *
     * @returns Login time or undefined if it was not set.
     */
    private getLoginTime = async (): Promise<number | undefined> => {
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
     * 1. exclusions mode is regular
     * 2. 1 hour passed since login time
     * 3. user had opened popup 4 times
     *
     * If testing flag is present in localStorage, 1-hour delay decreased to 1 minute.
     * To do so, open devtools in the extension popup and execute in console:
     * `await chrome.storage.local.set({'hint.popup.countdown': new Date(Date.now() - 1000 * 60 * 60 * 1).getTime()})`,
     * after that close and open the popup again.
     *
     * @returns Promise with true if hint popup should be shown, false otherwise.
     */
    public shouldShowHintPopup = async (): Promise<boolean> => {
        // do not show the hint popup for the selective mode. AG-24991
        if (await exclusions.getMode() === ExclusionsMode.Selective) {
            return false;
        }

        // Do not show hint if login time is null (shown already) or undefined (not logged in yet)
        const loginTime = await this.getLoginTime();
        if (typeof loginTime !== 'number') {
            return false;
        }

        const isTesting = await browserApi.storage.get(TEST_KEY);
        const hintPopupDelay = isTesting ? HINT_POPUP_TEST_DELAY : HINT_POPUP_DELAY;
        const isDelayPassedSinceLogin = loginTime + hintPopupDelay <= Date.now();

        // Add 1 to popupOpenedNum because shouldShowHintPopup called for next popup opening
        const popupOpenedCount = await popupOpenedCounter.getCount();
        const isPopupOpenedEnough = popupOpenedCount + 1 >= POPUP_OPENED_COUNT_TO_SHOW_HINT;

        return isDelayPassedSinceLogin && isPopupOpenedEnough;
    };
}

export const hintPopup = new HintPopup();
