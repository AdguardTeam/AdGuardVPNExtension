import browser from 'webextension-polyfill';

class Storage {
    constructor() {
        this.vault = browser.storage.local;
    }

    async set(key, data) {
        return this.vault.set({ [key]: data });
    }

    async get(key) {
        const value = await this.vault.get([key]);
        return value[key];
    }

    async remove(key) {
        return this.vault.remove([key]);
    }
}

const storage = new Storage();

export default storage;
