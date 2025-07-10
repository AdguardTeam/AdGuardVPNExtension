import browser from 'webextension-polyfill';

import { log } from '../../common/logger';
import {
    type StorageKey,
    storageDataScheme,
    type StorageData,
    DEFAULT_STORAGE_DATA,
} from '../schema';
import { Prefs } from '../../common/prefs';

export interface StateStorageInterface {
    getItem<T>(key: StorageKey): T;

    setItem<T>(key: StorageKey, value: T): void;

    init(): Promise<void>;
}

/**
 * A class provides methods for storing and retrieving data in the browser's session storage.
 * The state is stored in session storage in order to
 * quickly restore it after the service worker wakes up.
 *
 * @implements {StateStorageInterface}
 */
export class StateStorage implements StateStorageInterface {
    /**
     * Is the state storage initialized flag.
     */
    private isInit = false;

    /**
     * All state data is stored in this object.
     */
    private state: StorageData;

    /**
     * Promise that resolves when the state data object has been initialized.
     */
    private initPromise: Promise<void> | null = null;

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

        /**
         * Strip non-serializable data from the object before storing it in the session storage
         * in Firefox, because it throws an error when trying to store non-serializable data.
         */
        let storageValue = value;
        if (Prefs.isFirefox() && typeof value === 'object') {
            try {
                storageValue = JSON.parse(JSON.stringify(value));
            } catch (e) {
                // only circular reference can cause this error
                log.error('Unable to serialize data for storage:', e);
                return;
            }
        }

        browser.storage.session
            .set({ [key]: storageValue })
            .catch((e) => {
                log.error(e);
            });
    };

    /**
     * Initializes the storage by loading the data from the session storage,
     * or creating a new storage with the default data if none exists.
     */
    private innerInit = async (): Promise<void> => {
        try {
            const res = storageDataScheme.safeParse(await browser.storage.session.get(null));

            if (res.success) {
                this.state = res.data;
            } else {
                this.state = { ...DEFAULT_STORAGE_DATA };
                await browser.storage.session.set(this.state);
            }

            this.isInit = true;
        } catch (e) {
            log.error(e);
        }
    };

    /**
     * Initializes the state storage.
     *
     * Note: You can call this method to wait for the storage to be initialized,
     * because it was implemented as it can be called multiple times but
     * initialization will happen only once.
     *
     * @returns Promise that resolves when the storage is initialized.
     */
    public init = async (): Promise<void> => {
        if (!this.initPromise) {
            this.initPromise = this.innerInit();
        }

        return this.initPromise;
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
