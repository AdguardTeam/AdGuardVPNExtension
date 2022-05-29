import browserApi from './browserApi';
import notifier from '../lib/notifier';

const OPEN_RATE_MODAL_COUNTDOWN_KEY = 'open.rate.modal.countdown';

interface RateModalInterface {
    getCountdownStart: () => Promise<number | undefined>;
    disableOpening: () => Promise<void>;
}

class RateModal implements RateModalInterface {
    constructor() {
        notifier.addSpecifiedListener(
            notifier.types.USER_AUTHENTICATED,
            this.handleOpening,
        );
    }

    getCountdownStart = async (): Promise<number | undefined> => {
        return browserApi.storage.get(OPEN_RATE_MODAL_COUNTDOWN_KEY);
    };

    setCountdownStart = async (value: number | null): Promise<void> => {
        await browserApi.storage.set(OPEN_RATE_MODAL_COUNTDOWN_KEY, value);
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

    disableOpening = async (): Promise<void> => {
        await this.setCountdownStart(null);
    };
}

export const rateModal = new RateModal();
