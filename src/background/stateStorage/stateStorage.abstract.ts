import type { StorageKey } from '../schema';

// FIXME: switch from any to unknown type
export interface StateStorage {
    getItem(key: StorageKey): any;

    setItem(key: StorageKey, value: any): void;

    init(): Promise<void>;
}
