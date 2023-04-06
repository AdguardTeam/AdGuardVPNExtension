/**
 * This service is for managing the extension state.
 * The state is stored in session storage in order to
 * quickly restore it after the service worker wakes up.
 */
import { log } from '../../../lib/logger';
import {
    StorageKey,
    storageDataScheme,
    StorageData,
    DEFAULT_STORAGE_DATA,
} from '../../schema';
import { StateStorageInterface } from '../stateStorage.abstract';

class StateStorage implements StateStorageInterface {
    private isInit = false;

    private state: StorageData;

    public getItem = (key: StorageKey): any => {
        if (!this.isInit) {
            throw StateStorage.createNotInitializedError();
        }

        return this.state[key];
    };

    public setItem = (key: StorageKey, value: any): void => {
        if (!this.isInit) {
            throw StateStorage.createNotInitializedError();
        }

        this.state[key] = value;

        chrome.storage.session
            .set({ [key]: value })
            .catch((e) => {
                log.error(e);
            });
    };

    public init = async () => {
        try {
            const res = storageDataScheme.safeParse(chrome.storage.session.get(null));

            if (res.success) {
                this.state = res.data;
            } else {
                this.state = { ...DEFAULT_STORAGE_DATA };
                await chrome.storage.session.set(this.state);
            }

            this.isInit = true;
        } catch (e) {
            log.error(e);
        }
    };

    private static createNotInitializedError(): Error {
        return new Error('StateStorage is not initialized. Call init() method first.');
    }
}

export const sessionState = new StateStorage();
