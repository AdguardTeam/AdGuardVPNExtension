export default class StatsStorage {
    STATS_STORAGE_KEY = 'stats.storage.key';

    EMPTY_STATS = {
        total: { downloaded: 0, uploaded: 0 },
        current: { downloaded: 0, uploaded: 0 },
    };

    constructor(storage) {
        this.storage = storage;
    }

    async saveStats(domain, stats) {
        const { downloaded, uploaded } = stats;
        const key = this.getKey(domain);
        const storageStats = await this.storage.get(key) || this.EMPTY_STATS;
        let {
            total: { downloaded: totalDownloaded, uploaded: totalUploaded },
            current: { downloaded: currentDownloaded, uploaded: currentUploaded },
        } = storageStats || {};
        if (downloaded < currentDownloaded || uploaded < currentUploaded) {
            totalDownloaded += currentDownloaded;
            totalUploaded += currentUploaded;
            currentDownloaded = downloaded;
            currentUploaded = uploaded;
        } else {
            currentDownloaded = downloaded;
            currentUploaded = uploaded;
        }
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
            total: { downloaded: tDown, uploaded: tUp },
            current: { downloaded: cDown, uploaded: cUp },
        } = await this.storage.get(key) || this.EMPTY_STATS;
        return { downloaded: tDown + cDown, uploaded: tUp + cUp };
    }
}
