import { type StorageData, type StorageKey } from '../schema';

import { stateStorage, type PartialState } from './stateStorage';

/**
 * Helper class for `StateStorage` to manage state data associated with a specific key.
 */
export class StateData<T extends StorageKey> {
    /**
     * Key for state data.
     */
    private key: T;

    /**
     * Constructor.
     *
     * @param key Key for state data.
     */
    constructor(key: T) {
        this.key = key;
    }

    /**
     * Retrieves state data associated with the key.
     *
     * @returns State data associated with the key.
     */
    public async get(): Promise<StorageData[T]> {
        return stateStorage.getItem(this.key);
    }

    /**
     * Sets state data associated with the key.
     *
     * @param state State data to be set.
     */
    public async set(state: StorageData[T]): Promise<void> {
        return stateStorage.setItem(this.key, state);
    }

    /**
     * Partially updates state data associated with the key.
     *
     * Note: If the current value of the associated key is not an object, this method does nothing.
     *
     * @param partialState Partial state data to be updated.
     */
    public async update(partialState: PartialState<T>): Promise<void> {
        return stateStorage.updateItem(this.key, partialState);
    }
}
