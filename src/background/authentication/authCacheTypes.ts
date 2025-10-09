/**
 * IMPORTANT:
 * Do not import inside this file other dependencies,
 * because imports of this file are also used in the popup
 * and redundant code from background may get into popup code
 */

import { type WebAuthState } from '../auth/webAuthEnums';

/**
 * Enum for Auth cache keys.
 */
export enum AuthCacheKey {
    PolicyAgreement = 'policyAgreement',
    HelpUsImprove = 'helpUsImprove',
    WebAuthFlowState = 'webAuthFlowState',
}

/**
 * Interface for Auth cache data.
 */
export interface AuthCacheData {
    [AuthCacheKey.PolicyAgreement]: boolean;
    [AuthCacheKey.HelpUsImprove]: boolean;
    [AuthCacheKey.WebAuthFlowState]: WebAuthState;
}

/**
 * Interface for Auth cache values.
 */
export type AuthCacheValue = AuthCacheData[keyof AuthCacheData];
