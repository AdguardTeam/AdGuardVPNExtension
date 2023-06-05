import { log } from '../../../lib/logger';
import {
    StorageKey,
    storageDataScheme,
    StorageData,
    DEFAULT_STORAGE_DATA,
} from '../../schema';
import { StateStorageInterface } from '../stateStorage.abstract';
import { wakeUpOptionsPage } from '../helper';

/**
 * A class provides methods for storing and retrieving data in the browser's session storage.
 * The state is stored in session storage in order to
 * quickly restore it after the service worker wakes up.
 *
 * @implements {StateStorageInterface}
 */
class StateStorage implements StateStorageInterface {
    private isInit = false;

    private state: StorageData;

    /**
     * Gets the value for the specified key from the session storage.
     *
     * @param {StorageKey} key - The key for which to get the value.
     * @returns {*} The value associated with the key.
     * @throws {Error} If the storage has not been initialized.
     */
    public getItem = <T>(key: StorageKey): T => {
        if (!this.isInit) {
            throw StateStorage.createNotInitializedError();
        }

        return <T> this.state[key];
    };

    /**
     * Sets the value for the specified key in the session storage.
     *
     * @param {StorageKey} key - The key for which to set the value.
     * @param {*} value - The value to set.
     * @returns {void}
     * @throws {Error} If the storage has not been initialized.
     */
    public setItem = <T>(key: StorageKey, value: T): void => {
        if (!this.isInit) {
            throw StateStorage.createNotInitializedError();
        }

        (<T> this.state[key]) = value;

        chrome.storage.session
            .set({ [key]: value })
            .catch((e) => {
                log.error(e);
            });
    };

    /**
     * Initializes the storage by loading the data from the session storage,
     * or creating a new storage with the default data if none exists.
     */
    public init = async (): Promise<void> => {
        try {
            const res = storageDataScheme.safeParse(await chrome.storage.session.get(null));

            if (res.success) {
                this.state = res.data;
            } else {
                this.state = { ...DEFAULT_STORAGE_DATA };
                await chrome.storage.session.set(this.state);
            }

            wakeUpOptionsPage();
            this.isInit = true;
        } catch (e) {
            log.error(e);
        }
    };

    /**
     * Creates an error object to be thrown if the storage has not been initialized.
     *
     * @private
     * @static
     * @returns {Error} An error object indicating that the storage has not been initialized.
     */
    private static createNotInitializedError(): Error {
        return new Error('StateStorage is not initialized. Call init() method first.');
    }
}

export const sessionState = new StateStorage();
