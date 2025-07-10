interface StorageInterface {
    [key: string]: any;
    set: jest.Mock<Promise<void>, [key: string, data: any]>;
    get: jest.Mock<Promise<string>, [key: string]>;
    remove: jest.Mock<Promise<boolean>, [key: string]>;
}

const storage: StorageInterface = {
    set: jest.fn(async (key: string, data: any): Promise<void> => {
        storage[key] = data;
    }),
    get: jest.fn(async (key: string): Promise<string> => {
        return storage[key];
    }),
    remove: jest.fn(async (key: string): Promise<boolean> => {
        return delete storage[key];
    }),
};

export const browserApi = {
    storage,
};
