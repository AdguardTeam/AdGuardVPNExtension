const chrome = require('sinon-chrome');

if (!chrome.runtime.id) {
    chrome.runtime.id = 'test';
}

declare global {
    namespace NodeJS {
        interface Global {
            chrome: any;
        }
    }
}

global.chrome = chrome;

global.chrome.storage.session = {
    __storage: {},
    set: jest.fn((setter: Record<string, any>): Promise<void> => {
        return new Promise((resolve) => {
            Object.keys(setter).forEach((key) => {
                // @ts-expect-error - partially implemented
                global.chrome.storage.session.__storage[key] = setter[key];
            });
            resolve();
        });
    }),
    // @ts-expect-error - partially implemented
    get: jest.fn(async (key: string | null): Promise<Record<string, any>> => {
        if (key === null) {
            // @ts-expect-error - partially implemented
            return global.chrome.storage.session.__storage;
        }

        return {
            // @ts-expect-error - partially implemented
            [key]: global.chrome.storage.session.__storage[key],
        };
    }),
    clear: jest.fn(async (): Promise<void> => {
        // @ts-expect-error - partially implemented
        global.chrome.storage.session.__storage = {};
    }),
};

export {};
