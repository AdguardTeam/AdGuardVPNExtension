import { vi, afterEach } from 'vitest';

// Mock global variables
(globalThis as any).__APP_CONFIG__ = {};

// Mock log to hide all logger message
vi.mock('../../src/common/logger');

// Mock browser API
vi.mock('../../src/background/browserApi', async () => {
    return vi.importActual('../__mocks__/browserApiMock');
});

// Mock timers
vi.mock('../../src/background/timers', () => {
    return {
        timers: {
            setTimeout: (callback: () => void, timeout: number) => Number(setTimeout(callback, timeout)),
            clearTimeout: (timerId: number): void => clearTimeout(timerId),
            setInterval: (callback: () => void, interval: number) => Number(setInterval(callback, interval)),
            clearInterval: (intervalId: number): void => clearInterval(intervalId),
        },
    };
});

// Clear all storage after each test
afterEach(async () => {
    await global.chrome.storage.local.clear();
    await global.chrome.storage.session.clear();
    await global.chrome.storage.sync.clear();
    await global.chrome.storage.managed.clear();
});
