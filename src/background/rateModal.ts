import { browserApi } from './browserApi';
import { notifier } from '../lib/notifier';

const OPEN_RATE_MODAL_COUNTDOWN_KEY = 'open.rate.modal.countdown';

const RATE_MODAL_DELAY = 1000 * 60 * 30; // 30 min

interface RateModalInterface {
    shouldShowRateModal: () => Promise<boolean>;
    setViewed: () => Promise<void>;
}

/**
 * Handles rate modal display.
 * Sets time of first login to browser storage and handles it to show rate modal after 30 min.
 * After rate modal has been shown, sets null instead of login time.
 */
class RateModal implements RateModalInterface {
    constructor() {
        notifier.addSpecifiedListener(
            notifier.types.USER_AUTHENTICATED,
            this.handleLoginTime,
        );
    }

    /**
     * Gets login time from browser storage
     */
    getLoginTime = async (): Promise<number | null | undefined> => {
        return browserApi.storage.get(OPEN_RATE_MODAL_COUNTDOWN_KEY);
    };

    /**
     * Sets login time from browser storage
     */
    setLoginTime = async (value: number | null): Promise<void> => {
        await browserApi.storage.set(OPEN_RATE_MODAL_COUNTDOWN_KEY, value);
    };

    handleLoginTime = async (): Promise<void> => {
        const loginTime = await this.getLoginTime();

        if (loginTime === null) {
            // null mens that rate modal has been shown already
            return;
        }

        if (loginTime === undefined) {
            const currentTime = Date.now();
            await this.setLoginTime(currentTime);
        }
    };

    /**
     * Sets login time to null to indicate rate modal has been shown already
     */
    setViewed = async (): Promise<void> => {
        await this.setLoginTime(null);
    };

    /**
     * Checks if 30 min passed since login time
     */
    shouldShowRateModal = async (): Promise<boolean> => {
        const loginTime = await this.getLoginTime();
        return !!(loginTime && (loginTime + RATE_MODAL_DELAY <= Date.now()));
    };
}

export const rateModal = new RateModal();
