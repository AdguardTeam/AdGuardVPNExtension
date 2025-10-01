import { SETTINGS_IDS } from '../common/constants';

import { authCache } from './authentication';
import { forwarder } from './forwarder';
import { settings } from './settings';
import { type AuthCacheData } from './authentication/authCacheTypes';

/**
 * Retrieves data needed for the consent page.
 *
 * @returns Object that contains data needed for consent page,
 * it returns following fields:
 * - `policyAgreement` - Whether user has accepted the policy.
 * - `helpUsImprove` - Whether user has accepted the help us improve.
 * - `webAuthFlowState` - Current state of the web authentication flow.
 * - `forwarderDomain` - The domain of the forwarder.
 */
export const getConsentData = async (): Promise<AuthCacheData & { forwarderDomain: string }> => {
    const {
        policyAgreement,
        helpUsImprove,
        webAuthFlowState,
    } = authCache.getCache();
    const forwarderDomain = await forwarder.updateAndGetDomain();

    return {
        policyAgreement,
        helpUsImprove,
        webAuthFlowState,
        forwarderDomain,
    };
};

/**
 * Sets the consent data in the settings.
 *
 * @param policyAgreement
 * @param helpUsImprove
 */
export const setConsentData = async (policyAgreement: boolean, helpUsImprove: boolean): Promise<void> => {
    // update settings with the provided values
    await settings.setSetting(SETTINGS_IDS.POLICY_AGREEMENT, policyAgreement);
    await settings.setSetting(SETTINGS_IDS.HELP_US_IMPROVE, helpUsImprove);
};
