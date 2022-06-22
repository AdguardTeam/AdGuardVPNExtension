const AuthCache = () => {
    const DEFAULTS = {
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
    const clearCache = () => {
        authCache = { ...DEFAULTS };
    };

    /**
     * Sets values to the storage
     * @param {string} field
     * @param {string|boolean} value
     */
    const updateCache = (field, value) => {
        authCache[field] = value;
    };

    /**
     * Returns all values
     * @returns {{step, login, username}}
     */
    const getCache = () => authCache;

    return {
        updateCache,
        getCache,
        clearCache,
    };
};

const authCache = AuthCache();

export default authCache;
