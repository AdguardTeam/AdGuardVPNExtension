import Browser from 'webextension-polyfill';

export interface StorageInterface {
    set: <T>(key: string, data: T) => Promise<void>;
    get: <T>(key: string) => Promise<T>;
    remove: (key: string) => Promise<void>;
}

export class Storage implements StorageInterface {
    vault: Browser.Storage.LocalStorageArea;

    constructor(browser: Browser.Browser) {
        this.vault = browser.storage.local;
    }

    async set<T>(key: string, data: T): Promise<void> {
        await this.vault.set({ [key]: data });
    }

    async get<T>(key: string): Promise<T> {
        const value = await this.vault.get([key]);
        return value[key];
    }

    async remove(key: string): Promise<void> {
        await this.vault.remove([key]);
    }
}
