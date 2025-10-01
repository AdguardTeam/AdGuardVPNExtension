import { vi, type Mock } from 'vitest';

interface StorageInterface {
    [key: string]: any;
    set: Mock<(key: string, data: any) => Promise<void>>;
    get: Mock<(key: string) => Promise<string>>;
    remove: Mock<(key: string) => Promise<boolean>>;
}

const storage: StorageInterface = {
    set: vi.fn(async (key: string, data: any): Promise<void> => {
        storage[key] = data;
    }),
    get: vi.fn(async (key: string): Promise<string> => {
        return storage[key];
    }),
    remove: vi.fn(async (key: string): Promise<boolean> => {
        return delete storage[key];
    }),
};

export const browserApi = {
    storage,
};
