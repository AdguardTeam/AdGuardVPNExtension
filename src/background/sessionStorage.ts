/**
 * This service is for managing the extension state.
 * The state is stored in session storage in order to
 * quickly restore it after the service worker wakes up.
 */
import { browserApi } from './browserApi';
import { log } from '../lib/logger';
import {
    StorageKey,
    storageDataScheme,
    StorageData,
    DEFAULT_STORAGE_DATA,
} from './schema';

const EXTENSION_STATE_KEY = 'AdgVpnExtStateKey';

class SessionStorage {
    private state: StorageData;

    public getItem = (key: StorageKey): any => {
        return this.state[key];
    };

    public setItem = (key: StorageKey, value: any): void => {
        this.state[key] = value;
        // TODO: maybe await
        chrome.storage.session.set({ [key]: value });
    };

    public init = async () => {
        try {
            const data = <StorageData | {}> await SessionStorage.getData();

            if (data && Object.keys(data).length) {
                this.state = storageDataScheme.parse({
                    ...DEFAULT_STORAGE_DATA,
                    ...data,
                });
                return;
            }

            // init default state
            this.state = { ...DEFAULT_STORAGE_DATA };
            await SessionStorage.setData(this.state);
            return;
        } catch (e) {
            log.error(e);
        }
    };

    private static async getData(): Promise<unknown> {
        if (browserApi.runtime.isManifestVersion2()) {
            const data = sessionStorage.getItem(EXTENSION_STATE_KEY);

            if (!data) {
                return null;
            }

            return JSON.parse(data);
        }

        return chrome.storage.session.get(null);
    }

    private static async setData(data: StorageData): Promise<void> {
        if (browserApi.runtime.isManifestVersion2()) {
            return sessionStorage.setItem(EXTENSION_STATE_KEY, JSON.stringify(data));
        }

        return chrome.storage.session.set(data);
    }
}

export const sessionState = new SessionStorage();
