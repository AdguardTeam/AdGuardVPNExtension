import type Browser from 'webextension-polyfill';

export interface StorageInterface {
    set: <T>(key: string, data: T) => Promise<void>;
    get: <T>(key: string) => Promise<T | undefined>;
    remove: (key: string) => Promise<void>;
}

export class Storage implements StorageInterface {
    vault: Browser.Storage.StorageArea;

    constructor(browser: Browser.Browser) {
        this.vault = browser.storage.local;
    }

    async set<T>(key: string, data: T): Promise<void> {
        await this.vault.set({ [key]: data });
    }

    async get<T>(key: string): Promise<T | undefined> {
        const value = await this.vault.get([key]);
        return value[key] as T | undefined;
    }

    async remove(key: string): Promise<void> {
        await this.vault.remove([key]);
    }
}
