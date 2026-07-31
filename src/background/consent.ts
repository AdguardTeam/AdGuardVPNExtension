import { SETTINGS_IDS } from '../common/constants';
import { type LocalePreference } from '../common/locale';

import { authCache } from './authentication';
import { forwarder } from './forwarder';
import { settings } from './settings';
import { type AuthCacheData } from './authentication/authCacheTypes';
import { type VariantCache } from './abTestManager/ABTestManager';
import { abTestManager } from './abTestManager';
import { telemetry } from './telemetry';

/**
 * Response data for consent page and early popup auth bootstrap.
 */
export type ConsentDataResponse = AuthCacheData & {
    forwarderDomain: string;
    selectedLanguage: LocalePreference;

    /**
     * Experiment variant assignments. Resolved early (same path as consent)
     * so onboarding can decide control vs personalized before startup UI.
     */
    experimentVariants: VariantCache;
};

/**
 * Retrieves data needed for the consent page and early popup bootstrap.
 *
 * Also waits for experiment assignment when telemetry is enabled, so the
 * popup has a stable variant snapshot before onboarding renders.
 *
 * @returns Object that contains data needed for consent page,
 * it returns following fields:
 * - `policyAgreement` - Whether user has accepted the policy.
 * - `helpUsImprove` - Whether user has accepted the help us improve.
 * - `webAuthFlowState` - Current state of the web authentication flow.
 * - `forwarderDomain` - The domain of the forwarder.
 * - `experimentVariants` - Cached A/B experiment variant assignments.
 */
export const getConsentData = async (): Promise<ConsentDataResponse> => {
    const {
        policyAgreement,
        helpUsImprove,
        webAuthFlowState,
    } = authCache.getCache();
    const forwarderDomain = await forwarder.updateAndGetDomain();

    const selectedLanguage = settings.getSelectedLanguage();

    // Same early path as consent: ensure assignment before popup decides onboarding variant.
    await telemetry.ensureExperimentAssignment();
    const experimentVariants = await abTestManager.getVariantsForProps();

    return {
        policyAgreement,
        helpUsImprove,
        webAuthFlowState,
        forwarderDomain,
        selectedLanguage,
        experimentVariants,
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
