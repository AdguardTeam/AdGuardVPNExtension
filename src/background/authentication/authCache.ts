import { notifier } from '../../common/notifier';
import { WebAuthState } from '../auth/webAuthEnums';

import { AuthCacheKey, type AuthCacheData } from './authCacheTypes';

export interface AuthCacheInterface {
    /**
     * Sets values to the storage.
     *
     * @param field Field to update.
     * @param value New value.
     */
    updateCache<T extends AuthCacheKey>(field: T, value: AuthCacheData[T]): void;

    /**
     * Gets all cached authentication data.
     *
     * @returns All cached authentication values including credentials and settings.
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
        [AuthCacheKey.WebAuthFlowState]: WebAuthState.Idle,
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
    const updateCache = <T extends AuthCacheKey>(field: T, value: AuthCacheData[T]): void => {
        const isDifferent = authCache[field] !== value;
        authCache[field] = value;
        if (isDifferent) {
            notifier.notifyListeners(notifier.types.AUTH_CACHE_UPDATED, field, value);
        }
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
