import type { StorageKey } from '../schema';

// FIXME: switch from any to unknown type
export interface StateStorageInterface {
    getItem(key: StorageKey): any;

    setItem(key: StorageKey, value: any): void;

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
