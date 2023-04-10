import { DEFAULT_STORAGE_DATA, StorageData, StorageKey } from '../../schema';
import { StateStorageInterface } from '../stateStorage.abstract';

/**
 * A class provides methods for storing and retrieving data in the storage data object.
 *
 * @implements {StateStorageInterface}
 */
export class StateStorage implements StateStorageInterface {
    private state: StorageData;

    /**
     * Retrieves the value associated with the specified key from the storage data object.
     *
     * @param {StorageKey} key - The key to look up in the storage data object.
     */
    public getItem(key: StorageKey): any {
        return this.state[key];
    }

    /**
     * Sets the value associated with the specified key in the storage data object.
     *
     * @param {StorageKey} key - The key for which to set the value.
     * @param {*} value - The value to set.
     * @returns {void}
     */
    public setItem(key: StorageKey, value: any): void {
        this.state[key] = value;
    }

    /**
     * Initializes the storage data object with the default data.
     *
     * @returns {Promise<void>} A promise that resolves when the storage data object has been initialized.
     */
    public init(): Promise<void> {
        this.state = { ...DEFAULT_STORAGE_DATA };
        return Promise.resolve();
    }
}

export const sessionState = new StateStorage();
