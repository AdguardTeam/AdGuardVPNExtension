import tabs from './tabs';
import { THANK_YOU_PAGE_URL } from './config';

export const openThankYouPage = async (runInfo) => {
    if (runInfo.isFirstRun) {
        await tabs.openTab(THANK_YOU_PAGE_URL);
    }
};
