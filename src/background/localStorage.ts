import { browserApi } from './browserApi';

const setItem = async (key: string, value: unknown): Promise<unknown> => {
    return browserApi.storage.set(key, value);
};

const getItem = async (key: string): Promise<unknown> => {
    return browserApi.storage.get(key);
};

const removeItem = async (key: string): Promise<unknown> => {
    return browserApi.storage.remove(key);
};

const localStorageAbstract = {
    setItem,
    getItem,
    removeItem,
};

export const browserLocalStorage = browserApi.runtime.isManifestVersion2() ? localStorage : localStorageAbstract;
