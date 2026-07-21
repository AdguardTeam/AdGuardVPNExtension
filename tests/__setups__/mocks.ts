import { vi, afterEach } from 'vitest';

// Mock global variables
(globalThis as any).__APP_CONFIG__ = {};

// Mock window.matchMedia (jsdom does not provide it; some stores call
// it during construction at module-load time via SettingsStore.getSystemTheme)
if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
}

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
