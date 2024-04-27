import { getForwarderUrl } from '../common/helpers';
import { Prefs } from '../common/prefs';

import { forwarder } from './forwarder';
import { tabs } from './tabs';
import { FORWARDER_URL_QUERIES } from './config';
import { updateService } from './updateService';

export const openThankYouPage = async (): Promise<void> => {
    if (!updateService.isFirstRun) {
        return;
    }

    const forwarderDomain = await forwarder.updateAndGetDomain();

    /**
     * Needed for auth on website after install in Firefox MV3
     * since content-script cannot be injected and custom protocol handler is implemented,
     * so to avoid custom url redirecting for older versions of the extension
     * extra query param is added to the url `firefox=true`
     */
    const pageUrl = Prefs.isFirefox()
        ? getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.FIREFOX_THANK_YOU_PAGE)
        : getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.THANK_YOU_PAGE);

    await tabs.openTab(pageUrl);
};
