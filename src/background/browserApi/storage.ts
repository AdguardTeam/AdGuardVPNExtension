import Browser from 'webextension-polyfill';

export interface StorageInterface {
    set: (key: string, data: any) => Promise<any>;
    get: (key: string) => Promise<any>;
    remove: (key: string) => Promise<any>;
}

export default class Storage implements StorageInterface {
    vault: Browser.Storage.LocalStorageArea;

    constructor(browser: Browser.Browser) {
        this.vault = browser.storage.local;
    }

    async set(key: string, data: any): Promise<any> {
        return this.vault.set({ [key]: data });
    }

    async get(key: string): Promise<any> {
        const value = await this.vault.get([key]);
        return value[key];
    }

    async remove(key: string): Promise<any> {
        return this.vault.remove([key]);
    }
}
