import browserApi from './browserApi';

import tabs from './tabs';
import { THANK_YOU_PAGE_URL } from './config';
import { updateService } from './updateService';
import notifier from '../lib/notifier';
import { flagsStorage } from './flagsStorage';

// FIXME change to 30 min after testing
const RATE_MODAL_DELAY = 1000 * 30; // 30 sec
const RATE_MODAL_DISPLAY_TIME_KEY = 'rate.modal.display.time';

export const openThankYouPage = async () => {
    if (updateService.isFirstRun) {
        await tabs.openTab(THANK_YOU_PAGE_URL);
    }
};

const openRateModal = async () => {
    notifier.notifyListeners(notifier.types.OPEN_POPUP_RATE_MODAL);
    await flagsStorage.setOpenRateModalFlag();
};

const handleRateModalOpening = async () => {
    const rateModalDisplayTime = await browserApi.storage.get(RATE_MODAL_DISPLAY_TIME_KEY);
    const currentDate = new Date();
    const currentTime = currentDate.getTime();

    if (!rateModalDisplayTime) {
        await browserApi.storage.set(RATE_MODAL_DISPLAY_TIME_KEY, currentTime + RATE_MODAL_DELAY);
        setTimeout(() => {
            openRateModal();
        }, RATE_MODAL_DELAY);
        return;
    }
    if (rateModalDisplayTime > currentTime) {
        setTimeout(() => {
            openRateModal();
        }, rateModalDisplayTime - currentTime);
    }
};

export const initRateModal = () => {
    // open rate modal once after 30 min on user logged in, even if he will relogin
    notifier.addSpecifiedListener(
        notifier.types.USER_AUTHENTICATED,
        handleRateModalOpening,
    );
};
