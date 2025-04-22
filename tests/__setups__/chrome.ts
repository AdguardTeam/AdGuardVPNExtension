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
    set: async (setter: Record<string, any>): Promise<void> => {
        Object.keys(setter).forEach((key) => {
            // @ts-expect-error
            global.chrome.storage.session.__storage[key] = setter[key];
        });
    },
    // @ts-expect-error - partially implemented
    get: async (key: string | null): Promise<Record<string, any>> => {
        if (key === null) {
            // @ts-expect-error
            return global.chrome.storage.session.__storage;
        }

        return {
            // @ts-expect-error
            [key]: global.chrome.storage.session.__storage[key],
        };
    },
    clear: async (): Promise<void> => {
        // @ts-expect-error
        global.chrome.storage.session.__storage = {};
    },
};

export {};
