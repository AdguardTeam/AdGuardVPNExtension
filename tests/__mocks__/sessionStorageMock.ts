export const sessionStorageMock = {
    __storage: {} as Record<string, any>,
    set: async (setter: Record<string, any>): Promise<void> => {
        Object.keys(setter).forEach((key) => {
            sessionStorageMock.__storage[key] = setter[key];
        });
    },
    get: async (key: string | null): Promise<Record<string, any>> => {
        if (key === null) {
            return sessionStorageMock.__storage;
        }

        return {
            [key]: sessionStorageMock.__storage[key],
        };
    },
    clear: async (): Promise<void> => {
        sessionStorageMock.__storage = {};
    },
};
