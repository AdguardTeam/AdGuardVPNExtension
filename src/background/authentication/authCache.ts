import { notifier } from '../../common/notifier';

import { AuthCacheKey, type AuthCacheValue, type AuthCacheData } from './authCacheTypes';

export interface AuthCacheInterface {
    /**
     * Sets values to the storage.
     *
     * @param field Field to update.
     * @param value New value.
     */
    updateCache(field: AuthCacheKey, value: AuthCacheValue): void;

    /**
     * Returns all values
     */
    getCache(): AuthCacheData;

    /**
     * Sets values to default
     */
    clearCache(): void;
}

const AuthCache = (): AuthCacheInterface => {
    /**
     * Default values for the authentication cache.
     */
    const DEFAULTS: AuthCacheData = {
        [AuthCacheKey.PolicyAgreement]: false,
        [AuthCacheKey.HelpUsImprove]: false,
        [AuthCacheKey.MarketingConsent]: false,
        [AuthCacheKey.IsWebAuthFlowStarted]: false,
        [AuthCacheKey.IsWebAuthFlowLoading]: false,
        [AuthCacheKey.IsWebAuthFlowHasError]: false,
    };

    /**
     * Current values for the authentication cache.
     */
    let authCache = { ...DEFAULTS };

    /** @inheritdoc */
    const clearCache = (): void => {
        authCache = { ...DEFAULTS };
    };

    /** @inheritdoc */
    const updateCache = (field: AuthCacheKey, value: AuthCacheValue): void => {
        authCache[field] = value;
        notifier.notifyListeners(notifier.types.AUTH_CACHE_UPDATED, field, value);
    };

    /** @inheritdoc */
    const getCache = (): AuthCacheData => authCache;

    return {
        updateCache,
        getCache,
        clearCache,
    };
};

export const authCache = AuthCache();
