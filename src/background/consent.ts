import { SETTINGS_IDS } from '../common/constants';

import { forwarder } from './forwarder';
import { settings } from './settings';

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
};
