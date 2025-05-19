import { sessionStorageMock } from '../__mocks__/sessionStorageMock';

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

// @ts-expect-error Partially mocked
global.chrome.storage.session = sessionStorageMock;

export {};
