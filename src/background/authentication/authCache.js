function AuthCache() {
    const DEFAULTS = {
        username: '',
        password: '',
        step: '',
    };

    let authStorage = { ...DEFAULTS };

    /**
     * Sets values to default
     */
    const clearAuthCache = () => {
        authStorage = { ...DEFAULTS };
    };

    /**
     * Sets values to the storage
     * @param {string} field
     * @param {string} value
     */
    const updateAuthCache = (field, value) => {
        authStorage[field] = value;
    };

    /**
     * Returns all values
     * @returns {{step, login, username}}
     */
    const getAuthCache = () => authStorage;

    return {
        updateAuthCache,
        getAuthCache,
        clearAuthCache,
    };
}

const authCache = new AuthCache();

export default authCache;
