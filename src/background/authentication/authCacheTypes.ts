/**
 * Enum for Auth cache keys.
 */
export enum AuthCacheKey {
    PolicyAgreement = 'policyAgreement',
    HelpUsImprove = 'helpUsImprove',
    MarketingConsent = 'marketingConsent',
    IsWebAuthFlowStarted = 'isWebAuthFlowStarted',
    IsWebAuthFlowLoading = 'isWebAuthFlowLoading',
    IsWebAuthFlowHasError = 'isWebAuthFlowHasError',
}

/**
 * Type for Auth cache values.
 */
export type AuthCacheValue = boolean | null | string;

/**
 * Interface for Auth cache data.
 */
export interface AuthCacheData {
    [AuthCacheKey.PolicyAgreement]: AuthCacheValue;
    [AuthCacheKey.HelpUsImprove]: AuthCacheValue;
    [AuthCacheKey.MarketingConsent]: AuthCacheValue;
    [AuthCacheKey.IsWebAuthFlowStarted]: AuthCacheValue;
    [AuthCacheKey.IsWebAuthFlowLoading]: AuthCacheValue;
    [AuthCacheKey.IsWebAuthFlowHasError]: AuthCacheValue;
}
