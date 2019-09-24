const defaultAuthStorage = {
    username: '',
    login: '',
    step: '',
};

function AuthCache() {
    let authStorage = { ...defaultAuthStorage };

    const clearAuthCache = () => {
        authStorage = { ...defaultAuthStorage };
    };

    /**
     * Sets values to the storage
     * @param {string} field
     * @param {string} value
     */
    const updateAuthCache = (field, value) => {
        authStorage[field] = value;
    };

    const getAuthCache = () => authStorage;

    return {
        updateAuthCache,
        getAuthCache,
        clearAuthCache,
    };
}


const authCache = new AuthCache();

export default authCache;
