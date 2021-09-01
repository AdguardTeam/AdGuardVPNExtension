export const DEFAULT_CACHE_EXPIRE_TIME_MS = 30 * 60 * 1000;

/**
 * This memory cache is used for store api urls with expirable timestapm
 */
class ApiUrlCache extends Map {
    set(key, url) {
        return super.set(key, {
            url,
            timestamp: Date.now(),
        });
    }

    /**
     * Check url expiration
     * @param {*} key API url identificator
     * @param {*} cacheExpireTimeMs the time after which the url is considered expired
     * @returns {boolean}
     */
    isNeedUpdate(key, cacheExpireTimeMs = DEFAULT_CACHE_EXPIRE_TIME_MS) {
        const urlData = super.get(key);

        return !urlData || Date.now() - urlData.timestamp > cacheExpireTimeMs;
    }
}

export const apiUrlCache = new ApiUrlCache();
