import { getForwarderUrl } from '../common/helpers';
import { Prefs } from '../common/prefs';
import { CONSENT_PAGE_URL } from '../common/constants';

import { forwarder } from './forwarder';
import { tabs } from './tabs';
import { FORWARDER_URL_QUERIES } from './config';
import { updateService } from './updateService';
import { getUrl } from './browserApi/runtime';

/**
 * Opens post-installation page.
 * For Firefox - consent page, for other browsers - thank you page.
 */
export const openPostInstallPage = async (): Promise<void> => {
    if (!updateService.isFirstRun) {
        return;
    }

    const forwarderDomain = await forwarder.updateAndGetDomain();

    const pageUrl = Prefs.isFirefox()
        ? getUrl(CONSENT_PAGE_URL)
        : getForwarderUrl(forwarderDomain, FORWARDER_URL_QUERIES.THANK_YOU_PAGE);

    await tabs.openTab(pageUrl);
};
