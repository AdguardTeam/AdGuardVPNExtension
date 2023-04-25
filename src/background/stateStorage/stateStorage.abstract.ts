import type { StorageKey } from '../schema';

export interface StateStorageInterface {
    getItem<T>(key: StorageKey): T;

    setItem<T>(key: StorageKey, value: T): void;

    init(): Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorFunction = (arg?: unknown) => {
    throw new Error('Seems like webpack didn\'t inject proper State Storage implementation');
};

export const sessionState: StateStorageInterface = (() => {
    return {
        init: errorFunction,
        getItem: errorFunction,
        setItem: errorFunction,
    };
})();
