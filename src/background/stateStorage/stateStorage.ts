import browser from 'webextension-polyfill';
import throttle from 'lodash/throttle';
import * as v from 'valibot';

import { log } from '../../common/logger';
import {
    type StorageKey,
    storageDataScheme,
    type StorageData,
    DEFAULT_STORAGE_DATA,
} from '../schema';

/**
 * Turns object type T into a partial type, or never if T is not an object.
 *
 * Note: If T can be `null` or `undefined`, they are excluded from the object check.
 */
export type PartialState<
    K extends StorageKey,
    S = NonNullable<StorageData[K]>,
> = S extends object
    ? Partial<S>
    : never;

/**
 * {@link StateStorage} interface.
 */
export interface StateStorageInterface {
    /**
     * Initializes the state storage.
     *
     * Note: You can call this method to wait for the state storage to be initialized,
     * because it was implemented as it can be called multiple times but
     * initialization will happen only once.
     *
     * @returns Promise that resolves when the state storage is initialized.
     */
    init(): Promise<void>;

    /**
     * Gets the value for the specified key from the session storage.
     *
     * @param key The key for which to get the value.
     *
     * @returns The value associated with the key.
     */
    getItem<K extends StorageKey>(key: K): Promise<StorageData[K]>;

    /**
     * Sets the value for the specified key in the session storage.
     *
     * @param key The key for which to set the value.
     * @param value The value to set.
     */
    setItem<K extends StorageKey>(key: K, value: StorageData[K]): Promise<void>;

    /**
     * Partially updates the value for the specified key in the session storage.
     *
     * Note:
     * - If the current value of the associated key is not an object, this method does nothing.
     * - It shallow merges the current value with the partial value.
     *
     * @param key The key for which to partially update the value.
     * @param partialValue The partial value to update.
     */
    updateItem<K extends StorageKey>(key: K, partialValue: PartialState<K>): Promise<void>;
}

/**
 * A class provides methods for storing and retrieving data in the browser's session storage.
 * The state is stored in session storage in order to quickly restore it after the service worker wakes up.
 *
 * Note: We don't use `onChanged` event to keep the in-memory state in sync with the session storage,
 * because to interact with the session storage we use only this class, so the in-memory state is always up-to-date.
 */
export class StateStorage implements StateStorageInterface {
    /**
     * Error message when no existing state storage data is found in the session storage.
     */
    private static EMPTY_STORAGE_ERROR = 'No existing state storage data found, fallback to default.';

    /**
     * Throttle timeout for saving state to session storage.
     * The value is set to 500 milliseconds.
     */
    private static readonly SAVE_THROTTLE_TIMEOUT_MS = 500;

    /**
     * All state data is stored in this object.
     */
    private state: StorageData;

    /**
     * Promise that resolves when the state data object has been initialized.
     */
    private initPromise: Promise<void> | null = null;

    /**
     * Constructor.
     */
    constructor() {
        // Throttle the saveItem method to avoid excessive writes to the session storage
        this.saveStateThrottled = throttle(
            this.saveState.bind(this),
            StateStorage.SAVE_THROTTLE_TIMEOUT_MS,
        );

        // Save entire state when the service worker is going to be suspended
        browser.runtime.onSuspend.addListener(this.saveState.bind(this));
    }

    /**
     * Saves the entire state object to the session storage.
     */
    private async saveState(): Promise<void> {
        await browser.storage.session.set(this.state);
    }

    /**
     * Throttled version of the {@link saveState} method.
     */
    private saveStateThrottled: () => Promise<void>;

    /**
     * Initializes the storage by loading the data from the session storage,
     * or creating a new storage with the default data if none exists.
     */
    private async innerInit(): Promise<void> {
        try {
            // Load all session storage data
            const rawStateStorage = await browser.storage.session.get(null);

            // If no data exists, throw the error to use the default data
            if (!rawStateStorage || Object.keys(rawStateStorage).length === 0) {
                throw new Error(StateStorage.EMPTY_STORAGE_ERROR);
            }

            // Parse and validate the loaded data
            const parsedStateStorage = v.parse(storageDataScheme, rawStateStorage);

            // If the data is valid, save it to the in-memory state object
            this.state = parsedStateStorage;
        } catch (e) {
            // Do not log the error if data not exists in the session storage
            if (e?.message !== StateStorage.EMPTY_STORAGE_ERROR) {
                log.debug('[vpn.StateStorage.innerInit]: Failed to initialize state storage, falling back to default.', e);
            }

            // Fallback to default data if parsing/validation fails or no data exists
            this.state = { ...DEFAULT_STORAGE_DATA };

            try {
                await this.saveState();
            } catch (e) {
                log.error('[vpn.StateStorage.innerInit]: Failed to save default state in state storage:', e);
            }
        }
    }

    /** @inheritdoc */
    public async init(): Promise<void> {
        if (!this.initPromise) {
            this.initPromise = this.innerInit();
        }

        return this.initPromise;
    }

    /** @inheritdoc */
    public async getItem<K extends StorageKey>(key: K): Promise<StorageData[K]> {
        // Wait for the storage to be initialized before getting the item
        await this.init();

        // Return the value from the in-memory state object
        return this.state[key];
    }

    /** @inheritdoc */
    public async setItem<K extends StorageKey>(key: K, value: StorageData[K]): Promise<void> {
        // Wait for the storage to be initialized before setting the item
        await this.init();

        // Strip non-serializable data from the object before storing it in the session storage,
        // because it throws an error when trying to store non-serializable data.
        let storageValue = value;
        if (typeof storageValue === 'object' && storageValue !== null) {
            try {
                storageValue = JSON.parse(JSON.stringify(value));
            } catch (e) {
                // only circular reference can cause this error
                log.error('[vpn.StateStorage.setItem]: Failed to serialize data for state storage:', e);
                return;
            }
        }

        // Validate state data before saving it to the session storage
        const validation = v.safeParse(storageDataScheme.entries[key], storageValue);
        if (!validation.success) {
            log.error('[vpn.StateStorage.setItem]: Failed to validate data for state storage:', validation.issues);
            return;
        }

        // Save the validated value
        storageValue = validation.output as StorageData[K];

        // Keep the previous value in case saving to session storage fails
        const prevValue = this.state[key];

        // Update the in-memory state object
        this.state[key] = storageValue;

        try {
            // Save the value to the session storage
            await this.saveStateThrottled();
        } catch (e) {
            // Revert the in-memory state back to the previous value if saving fails
            log.error('[vpn.StateStorage.setItem]: Failed to save item in state storage, reverting state back:', e);
            this.state[key] = prevValue;
        }
    }

    /** @inheritdoc */
    public async updateItem<K extends StorageKey>(key: K, partialValue: PartialState<K>): Promise<void> {
        // Wait for the storage to be initialized before partially setting the item
        await this.init();

        // Get the current value for the key
        const currentValue = await this.getItem(key);

        // If the current value is not an object, we cannot merge the partial value
        if (typeof currentValue !== 'object' || currentValue === null) {
            return;
        }

        // Set the updated value in the storage
        await this.setItem(key, { ...currentValue, ...partialValue });
    }
}

export const stateStorage = new StateStorage();
