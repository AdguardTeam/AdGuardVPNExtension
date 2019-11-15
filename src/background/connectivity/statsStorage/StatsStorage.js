export default class StatsStorage {
    STATS_STORAGE_KEY = 'stats.storage.key';

    EMPTY_STATS = {
        total: { downloaded: 0, uploaded: 0 },
        current: { downloaded: 0, uploaded: 0 },
    };

    constructor(storage) {
        this.storage = storage;
        this.sessions = new Set();
    }

    /**
     * Received stats contains the traffic gathered since the last check
     * Method adds these values to the total stats and to the current stats
     * (current stats reset when we save stats for the first time after startup)
     *
     * @param domain Proxy domain
     * @param stats Traffic statistic
     * @returns {Promise<void>}
     */
    async saveStats(domain, stats) {
        const { downloaded, uploaded } = stats;
        const key = this.getKey(domain);
        const storageStats = (await this.storage.get(key)) || this.EMPTY_STATS;

        let {
            total: { downloaded: totalDownloaded, uploaded: totalUploaded },
            current: { downloaded: currentDownloaded, uploaded: currentUploaded },
        } = storageStats;

        // If we've just start the session then reset the current traffic counter
        if (!this.sessions.has(domain)) {
            this.sessions.add(domain);
            currentDownloaded = 0;
            currentUploaded = 0;
        }

        totalDownloaded += downloaded;
        totalUploaded += uploaded;
        currentDownloaded += downloaded;
        currentUploaded += uploaded;

        await this.storage.set(key, {
            current: { downloaded: currentDownloaded, uploaded: currentUploaded },
            total: { downloaded: totalDownloaded, uploaded: totalUploaded },
        });
    }

    getKey(domainName) {
        return `${this.STATS_STORAGE_KEY}-${domainName}`;
    }

    async getStats(domain) {
        const key = this.getKey(domain);
        const {
            total: { downloaded, uploaded },
        } = await this.storage.get(key) || this.EMPTY_STATS;
        return { downloaded, uploaded };
    }

    /**
     * Reset the stats for the proxy domain
     * @param domain Proxy domain
     * @returns {Promise<void>}
     */
    async resetStats(domain) {
        const key = this.getKey(domain);
        this.sessions.delete(domain);
        await this.storage.set(key, this.EMPTY_STATS);
    }
}
