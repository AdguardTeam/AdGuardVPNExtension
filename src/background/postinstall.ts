import { tabs } from './tabs';
import { THANK_YOU_PAGE_URL } from './config';
import { updateService } from './updateService';

export const openThankYouPage = async (): Promise<void> => {
    if (updateService.isFirstRun) {
        await tabs.openTab(THANK_YOU_PAGE_URL);
    }
};
