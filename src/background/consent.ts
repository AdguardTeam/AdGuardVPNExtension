import { SETTINGS_IDS } from '../common/constants';

import { authCache } from './authentication';
import { forwarder } from './forwarder';
import { settings } from './settings';

/**
 * Retrieves data needed for the consent page.
 *
 * @returns Object that contains data needed for consent page,
 * it returns following fields:
 * - `policyAgreement` - Whether user has accepted the policy (After clicking "Continue" button).
 * - `cachedPolicyAgreement` - Whether user has accepted the policy (Before clicking "Continue" button).
 * - `cachedHelpUsImprove` - Whether user has agreed to help improve the service (Before clicking "Continue" button).
 * - `forwarderDomain` - The domain of the forwarder.
 */
export const getConsentData = async () => {
    const policyAgreement = settings.getSetting(SETTINGS_IDS.POLICY_AGREEMENT);

    const {
        policyAgreement: cachedPolicyAgreement,
        helpUsImprove: cachedHelpUsImprove,
        isWebAuthFlowHasError,
    } = authCache.getCache();

    const forwarderDomain = await forwarder.updateAndGetDomain();

    return {
        policyAgreement,
        cachedPolicyAgreement,
        cachedHelpUsImprove,
        isWebAuthFlowHasError,
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
