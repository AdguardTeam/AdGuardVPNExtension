import browserApi from './browserApi';
import notifier from '../lib/notifier';

const OPEN_RATE_MODAL_COUNTDOWN_KEY = 'open.rate.modal.countdown';

// FIXME change to 30 min after testing
const RATE_MODAL_DELAY = 1000 * 30; // 1 min

interface RateModalInterface {
    getCountdownStart: () => Promise<number | null | undefined>;
    setViewed: () => Promise<void>;
}

/**
 * Handles rate modal display.
 * Sets time of first login to browser storage and handles it in popup
 * to show rate modal after 30 min.
 * After rate modal has been shown, sets null instead of login time.
 */
class RateModal implements RateModalInterface {
    constructor() {
        notifier.addSpecifiedListener(
            notifier.types.USER_AUTHENTICATED,
            this.handleOpening,
        );
    }

    /**
     * Gets login time from browser storage
     */
    getCountdownStart = async (): Promise<number | null | undefined> => {
        return browserApi.storage.get(OPEN_RATE_MODAL_COUNTDOWN_KEY);
    };

    /**
     * Sets login time from browser storage
     * @param value
     */
    setCountdownStart = async (value: number | null): Promise<void> => {
        await browserApi.storage.set(OPEN_RATE_MODAL_COUNTDOWN_KEY, value);
    };

    shouldShowRateModal = async () => {
        const countdownStart = await this.getCountdownStart();
        return countdownStart && countdownStart + RATE_MODAL_DELAY <= Date.now();
    };

    handleOpening = async (): Promise<void> => {
        const countdownStart = await this.getCountdownStart();

        if (countdownStart === null) {
            // rate modal has been shown already
            return;
        }

        if (countdownStart === undefined) {
            const currentTime = Date.now();
            await this.setCountdownStart(currentTime);
        }
    };

    setViewed = async (): Promise<void> => {
        await this.setCountdownStart(null);
    };
}

export const rateModal = new RateModal();
