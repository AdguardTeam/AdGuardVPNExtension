import { SETTINGS_IDS } from '../common/constants';

import { authCache } from './authentication';
import { forwarder } from './forwarder';
import { settings } from './settings';

/**
 * Retrieves data needed for the consent page.
 *
 * @returns Object that contains data needed for consent page,
 * it returns following fields:
 * - `policyAgreement` - Whether user has accepted the policy.
 * - `helpUsImprove` - Whether user has accepted the help us improve.
 * - `marketingConsent` - Whether user has accepted marketing consent.
 * - `isWebAuthFlowHasError` - Whether there was an error in the web authentication flow.
 * - `forwarderDomain` - The domain of the forwarder.
 */
export const getConsentData = async () => {
    const {
        policyAgreement,
        helpUsImprove,
        marketingConsent,
        isWebAuthFlowHasError,
    } = authCache.getCache();

    const forwarderDomain = await forwarder.updateAndGetDomain();

    return {
        policyAgreement,
        helpUsImprove,
        marketingConsent,
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
