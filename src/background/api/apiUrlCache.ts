export const DEFAULT_CACHE_EXPIRE_TIME_MS = 1000 * 60 * 5; // 5 minutes

/**
 * This memory cache is used for store api urls with expirable timestamp
 */
class ApiUrlCache extends Map {
    set(key: string, url: string, expiresInMs = Date.now() + DEFAULT_CACHE_EXPIRE_TIME_MS) {
        return super.set(key, {
            url,
            expiresInMs,
        });
    }

    /**
     * Check url expiration
     * @param key API url identifier
     */
    needsUpdate(key: string): boolean {
        const urlData = super.get(key);

        return !urlData || urlData.expiresInMs < Date.now();
    }
}

export const apiUrlCache = new ApiUrlCache();
