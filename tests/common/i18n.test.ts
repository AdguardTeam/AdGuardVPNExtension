import {
    describe,
    it,
    expect,
    vi,
    beforeAll,
    type Mock,
} from 'vitest';

import { type MessagesJson } from '../../src/common/locale/localeTypes';
import { i18n } from '../../src/common/i18n';

const EN_MESSAGES: MessagesJson = {
    about_title: { message: 'About' },
    settings_title: { message: 'Settings' },
    only_in_english: { message: 'Only English' },
};

const DE_MESSAGES: MessagesJson = {
    about_title: { message: 'Über' },
    settings_title: { message: 'Einstellungen' },
};

/**
 * Maps locale codes to fixture data for the mock fetch.
 */
const LOCALE_FIXTURES: Record<string, MessagesJson> = {
    en: EN_MESSAGES,
    de: DE_MESSAGES,
};

/**
 * Current browser UI language for mock.
 */
let mockBrowserLocale = 'en';

/**
 * Mock browser.i18n.getMessage to return English messages.
 */
const mockBrowserGetMessage = vi.fn((key: string): string => {
    return EN_MESSAGES[key]?.message || '';
});

vi.mock('webextension-polyfill', () => ({
    default: {
        runtime: {
            getURL: (path: string): string => `chrome-extension://test-id/${path}`,
        },
        i18n: {
            getMessage: (key: string): string => mockBrowserGetMessage(key),
            getUILanguage: (): string => mockBrowserLocale,
        },
    },
}));

beforeAll(() => {
    global.fetch = vi.fn(async (url: string | URL | Request): Promise<Response> => {
        const urlStr = typeof url === 'string' ? url : url.toString();

        const match = urlStr.match(/_locales\/([^/]+)\/messages\.json/);
        const locale = match?.[1];

        if (locale && LOCALE_FIXTURES[locale]) {
            return new Response(JSON.stringify(LOCALE_FIXTURES[locale]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        throw new Error(`Fetch failed: ${urlStr}`);
    }) as Mock;
});

/**
 * NOTE: Tests are ordered intentionally. The "before init" block runs first
 * while the module-level `initialized` flag is still `false`. After that,
 * `init()` is called and all subsequent tests verify delegation behaviour.
 */
describe('i18n module', () => {
    describe('before init (browser API fallback)', () => {
        it('getMessage should fall back to browser.i18n.getMessage', () => {
            const result = i18n.getMessage('about_title');

            expect(mockBrowserGetMessage).toHaveBeenCalledWith('about_title');
            expect(result).toBe('About');
        });

        it('getUILanguage should fall back to browser.i18n.getUILanguage', () => {
            mockBrowserLocale = 'de-DE';

            const result = i18n.getUILanguage();

            expect(result).toBe('de_de');
        });

        it('getBaseMessage should return raw key in test environment', () => {
            const result = i18n.getBaseMessage('settings_title');

            // In test env, getBaseMessage returns the raw key so that
            // @adguard/translate has a fallback for top-level calls.
            expect(result).toBe('settings_title');
        });

        it('getBaseUILanguage should return "en"', () => {
            expect(i18n.getBaseUILanguage()).toBe('en');
        });
    });

    describe('init', () => {
        it('should initialize with explicit locale', async () => {
            mockBrowserLocale = 'de';

            await i18n.init('de');

            expect(i18n.getUILanguage()).toBe('de');
            expect(i18n.getMessage('about_title')).toBe('Über');
        });

        it('should accept "auto" and resolve to browser locale', async () => {
            mockBrowserLocale = 'de';

            await i18n.init('auto');

            expect(i18n.getUILanguage()).toBe('de');
            expect(i18n.getMessage('about_title')).toBe('Über');
        });

        it('should fall back to English on fetch failure', async () => {
            mockBrowserLocale = 'en';

            // 'fi' is valid but not in fixtures — fetch throws
            await i18n.init('fi');

            expect(i18n.getUILanguage()).toBe('en');
            expect(i18n.getMessage('about_title')).toBe('About');
        });
    });

    describe('after init (TranslationService delegation)', () => {
        it('getMessage should delegate to TranslationService', async () => {
            mockBrowserLocale = 'de';
            await i18n.init('de');

            expect(i18n.getMessage('about_title')).toBe('Über');
            expect(i18n.getMessage('settings_title')).toBe('Einstellungen');
        });

        it('getMessage should return empty string for untranslated key', () => {
            // Still on 'de' locale from previous test
            expect(i18n.getMessage('only_in_english')).toBe('');
        });

        it('getMessage should throw for nonexistent key', () => {
            expect(() => i18n.getMessage('nonexistent_key')).toThrow(
                'There is no such key "nonexistent_key" in the messages',
            );
        });

        it('getUILanguage should delegate to TranslationService', () => {
            expect(i18n.getUILanguage()).toBe('de');
        });

        it('getBaseMessage should delegate to TranslationService', async () => {
            await i18n.init('en');

            expect(i18n.getBaseMessage('about_title')).toBe('About');
            expect(i18n.getBaseMessage('nonexistent')).toBe('');
        });

        it('getBaseUILanguage should always return "en"', () => {
            expect(i18n.getBaseUILanguage()).toBe('en');
        });
    });
});
