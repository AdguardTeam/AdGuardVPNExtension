import { DEFAULT_STORAGE_DATA, StorageData, StorageKey } from '../../schema';
import { StateStorageInterface } from '../stateStorage.abstract';

/**
 * A class provides methods for storing and retrieving data in the storage data object.
 *
 * @implements {StateStorageInterface}
 */
class StateStorage implements StateStorageInterface {
    private state: StorageData;

    private initPromise: Promise<void>;

    /**
     * Retrieves the value associated with the specified key from the storage data object.
     *
     * @param {StorageKey} key - The key to look up in the storage data object.
     */
    public getItem<T>(key: StorageKey): T {
        return <T> this.state[key];
    }

    /**
     * Sets the value associated with the specified key in the storage data object.
     *
     * @param {StorageKey} key - The key for which to set the value.
     * @param {*} value - The value to set.
     * @returns {void}
     */
    public setItem<T>(key: StorageKey, value: T): void {
        (<T> this.state[key]) = value;
    }

    /**
     * Initializes the storage data object with the default data.
     *
     * @returns A promise that resolves when the storage data object has been initialized.
     */
    public init(): Promise<void> {
        this.state = { ...DEFAULT_STORAGE_DATA };
        this.initPromise = Promise.resolve();
        return this.initPromise;
    }

    /**
     * Returns init promise, which resolves when the storage data object has been initialized.
     */
    public async waitInit(): Promise<void> {
        return this.initPromise;
    }
}

export const stateStorage = new StateStorage();
