import { notifier } from '../../common/notifier';

import { AuthCacheKey, type AuthCacheValue, type AuthCacheData } from './authCacheTypes';

interface AuthCacheInterface {
    updateCache(field: AuthCacheKey, value: AuthCacheValue): void;
    getCache(): AuthCacheData;
    clearCache(): void;
}

const AuthCache = (): AuthCacheInterface => {
    const DEFAULTS: AuthCacheData = {
        [AuthCacheKey.PolicyAgreement]: null,
        [AuthCacheKey.HelpUsImprove]: null,
        [AuthCacheKey.MarketingConsent]: null,
    };

    let authCache = { ...DEFAULTS };

    /**
     * Sets values to default
     */
    const clearCache = (): void => {
        authCache = { ...DEFAULTS };
    };

    /**
     * Sets values to the storage
     * @param field
     * @param value
     */
    const updateCache = (field: AuthCacheKey, value: AuthCacheValue): void => {
        authCache[field] = value;
        notifier.notifyListeners(notifier.types.AUTH_CACHE_UPDATED, field, value);
    };

    /**
     * Returns all values
     */
    const getCache = (): AuthCacheData => authCache;

    return {
        updateCache,
        getCache,
        clearCache,
    };
};

export const authCache = AuthCache();
