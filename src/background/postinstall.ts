import { CONSENT_PAGE_URL } from '../common/constants';
import { tabs } from '../common/tabs';

import { updateService } from './updateService';
import { getUrl } from './browserApi/runtime';

/**
 * Opens post-installation consent page.
 */
export const openPostInstallPage = async (): Promise<void> => {
    if (!updateService.isFirstRun) {
        return;
    }

    await tabs.openTab(getUrl(CONSENT_PAGE_URL));
};
