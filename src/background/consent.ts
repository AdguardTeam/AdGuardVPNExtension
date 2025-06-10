import { SETTINGS_IDS, AUTH_STEPS, CONSENT_PAGE_URL } from '../common/constants';
import { getForwarderUrl } from '../common/helpers';
import { Prefs } from '../common/prefs';

import { authCache } from './authentication';
import { getUrl } from './browserApi/runtime';
import { FORWARDER_URL_QUERIES } from './config';
import { forwarder } from './forwarder';
import { settings } from './settings';
import { tabs } from './tabs';

/**
 * Retrieves data needed for the consent page.
 *
 * @returns Data containing policy agreement, help us improve setting, and forwarder domain.
 */
export const getConsentData = async () => {
    const policyAgreement = settings.getSetting(SETTINGS_IDS.POLICY_AGREEMENT);
    const helpUsImprove = settings.getSetting(SETTINGS_IDS.HELP_US_IMPROVE);
    const forwarderDomain = await forwarder.updateAndGetDomain();

    return {
        policyAgreement,
        helpUsImprove,
        forwarderDomain,
    };
};

/**
 * Sets the consent data in the settings.
 *
 * @param policyAgreement
 * @param helpUsImprove
 */
export const setConsentData = async (policyAgreement: boolean, helpUsImprove: boolean) => {
    // update settings with the provided values
    await settings.setSetting(SETTINGS_IDS.POLICY_AGREEMENT, policyAgreement);
    await settings.setSetting(SETTINGS_IDS.HELP_US_IMPROVE, helpUsImprove);

    // continue to the next step - Screenshot Flow
    authCache.updateCache('step', AUTH_STEPS.SCREENSHOT);

    /**
     * If Firefox, we should show thank you page after consent.
     * - If consent page is closed, we should open the thank you page in a new tab.
     * - If consent page is open, we should update the URL of the tab to the thank you page.
     */
    if (Prefs.isFirefox()) {
        const forwarderDomain = await forwarder.updateAndGetDomain();
        const firefoxThankYouPageUrl = getForwarderUrl(
            forwarderDomain,
            FORWARDER_URL_QUERIES.FIREFOX_THANK_YOU_PAGE,
        );

        const consentTab = await tabs.getTabByUrl(getUrl(CONSENT_PAGE_URL));

        if (consentTab && typeof consentTab.id === 'number') {
            await tabs.update(consentTab.id, firefoxThankYouPageUrl);
        } else {
            await tabs.openTab(firefoxThankYouPageUrl);
        }
    }
};
