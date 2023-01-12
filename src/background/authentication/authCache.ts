interface AuthCacheData {
    [key: string]: boolean | null | string;
}

interface AuthCacheInterface {
    updateCache(field: string, value: boolean | null | string): void;
    getCache(): AuthCacheData;
    clearCache(): void;
}

const AuthCache = (): AuthCacheInterface => {
    const DEFAULTS: AuthCacheData = {
        username: '',
        password: '',
        confirmPassword: '',
        step: '',
        signInCheck: false,
        policyAgreement: null,
        helpUsImprove: null,
        marketingConsent: null,
        authError: null,
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
     * @param {string} field
     * @param {string|boolean} value
     */
    const updateCache = (field: string, value: boolean | null | string): void => {
        authCache[field] = value;
    };

    /**
     * Returns all values
     * @returns {{step, login, username}}
     */
    const getCache = (): AuthCacheData => authCache;

    return {
        updateCache,
        getCache,
        clearCache,
    };
};

export const authCache = AuthCache();
