import { Prefs } from '../common/prefs';
import { tabs } from './tabs';
import { THANK_YOU_PAGE_URL, FIREFOX_THANK_YOU_PAGE_URL } from './config';
import { updateService } from './updateService';

export const openThankYouPage = async (): Promise<void> => {
    if (!updateService.isFirstRun) {
        return;
    }

    /**
     * Needed for auth on website after install in Firefox MV3
     * since content-script cannot be injected and custom protocol handler is implemented,
     * so to avoid custom url redirecting for older versions of the extension
     * extra query param is added to the url `firefox=true`
     */
    const pageUrl = Prefs.isFirefox() ? FIREFOX_THANK_YOU_PAGE_URL : THANK_YOU_PAGE_URL;

    await tabs.openTab(pageUrl);
};
