import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    type Mock,
} from 'vitest';

import { TranslationService } from '../../../src/common/locale/TranslationService';
import { BASE_LOCALE } from '../../../src/common/locale/localeConstants';
import { type MessagesJson } from '../../../src/common/locale/localeTypes';

const EN_MESSAGES: MessagesJson = {
    about_title: { message: 'About' },
    settings_title: { message: 'Settings' },
    greeting: { message: 'Hello' },
    only_in_english: { message: 'Only English' },
};

const DE_MESSAGES: MessagesJson = {
    about_title: { message: 'Über' },
    settings_title: { message: 'Einstellungen' },
    greeting: { message: 'Hallo' },
};

const RU_MESSAGES: MessagesJson = {
    about_title: { message: 'О программе' },
    settings_title: { message: 'Настройки' },
    greeting: { message: 'Привет' },
};

/**
 * Locale data with an invalid `.message` entry for FR-022 testing.
 */
const INVALID_MESSAGES: MessagesJson = {
    about_title: { message: 'Valid' },
    // @ts-expect-error intentionally invalid for testing
    broken_null: { message: null },
    // @ts-expect-error intentionally invalid for testing
    broken_undefined: { message: undefined },
    broken_empty: { message: '' },
    // @ts-expect-error intentionally invalid for testing
    broken_number: { message: 42 },
    valid_key: { message: 'Still valid' },
};

/**
 * Maps locale codes to fixture data for the mock fetch.
 */
const LOCALE_FIXTURES: Record<string, MessagesJson> = {
    en: EN_MESSAGES,
    de: DE_MESSAGES,
    ru: RU_MESSAGES,
    invalid_locale: INVALID_MESSAGES,
};

/**
 * Tracks fetch call URLs for assertion.
 */
let fetchCalls: string[] = [];

/**
 * Current browser UI language for mock.
 */
let mockBrowserLocale = 'en';

vi.mock('webextension-polyfill', () => ({
    default: {
        runtime: {
            getURL: (path: string): string => `chrome-extension://test-id/${path}`,
        },
        i18n: {
            getUILanguage: (): string => mockBrowserLocale,
        },
    },
}));

/**
 * Sets up the global fetch mock before each test.
 */
beforeEach(() => {
    fetchCalls = [];
    mockBrowserLocale = 'en';

    global.fetch = vi.fn(async (url: string | URL | Request): Promise<Response> => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        fetchCalls.push(urlStr);

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

describe('TranslationService', () => {
    describe('loadLocaleData — auto mode', () => {
        it('should load English base and browser locale with no preference', async () => {
            mockBrowserLocale = 'de';
            const service = new TranslationService();

            const resolved = await service.loadLocaleData();

            expect(resolved).toBe('de');
            expect(service.getMessage('de', 'about_title')).toBe('Über');
        });

        it('should only fetch once when browser locale is "en"', async () => {
            mockBrowserLocale = 'en';
            const service = new TranslationService();

            const resolved = await service.loadLocaleData();

            expect(fetchCalls).toHaveLength(1);
            expect(resolved).toBe('en');
        });

        it('should fetch two files when browser locale differs from English', async () => {
            mockBrowserLocale = 'de';
            const service = new TranslationService();

            await service.loadLocaleData();

            expect(fetchCalls).toHaveLength(2);
            expect(fetchCalls[0]).toContain('_locales/en/messages.json');
            expect(fetchCalls[1]).toContain('_locales/de/messages.json');
        });
    });

    describe('loadLocaleData — explicit preference', () => {
        it('should load German and return resolved locale', async () => {
            mockBrowserLocale = 'en';
            const service = new TranslationService();
            await service.loadLocaleData();

            const resolved = await service.loadLocaleData('de');

            expect(resolved).toBe('de');
            expect(service.getMessage('de', 'about_title')).toBe('Über');
        });

        it('should use cache on second load of same locale', async () => {
            mockBrowserLocale = 'en';
            const service = new TranslationService();
            await service.loadLocaleData();

            await service.loadLocaleData('de');
            const fetchCountAfterFirst = fetchCalls.length;

            await service.loadLocaleData('de');
            expect(fetchCalls.length).toBe(fetchCountAfterFirst);
        });
    });

    describe('getMessage — fallback', () => {
        it('should return empty string when key is missing in current locale but exists in English', async () => {
            mockBrowserLocale = 'en';
            const service = new TranslationService();
            await service.loadLocaleData();
            await service.loadLocaleData('de');

            // Returns '' so @adguard/translate falls back to getBaseMessage() + getBaseUILanguage(),
            // which correctly pairs the English message with English plural rules.
            expect(service.getMessage('de', 'only_in_english')).toBe('');
        });

        it('should throw when key does not exist in English base', async () => {
            mockBrowserLocale = 'en';
            const service = new TranslationService();
            await service.loadLocaleData();

            expect(() => service.getMessage('en', 'nonexistent_key')).toThrow(
                'There is no such key "nonexistent_key" in the messages',
            );
        });

        it('should skip invalid .message entries during flattening', async () => {
            mockBrowserLocale = 'en';
            const service = new TranslationService();
            await service.loadLocaleData();

            LOCALE_FIXTURES.be = INVALID_MESSAGES;
            await service.loadLocaleData('be');

            expect(service.getMessage('be', 'about_title')).toBe('Valid');
            expect(() => service.getMessage('be', 'broken_null')).toThrow();

            delete LOCALE_FIXTURES.be;
        });
    });

    describe('edge cases', () => {
        it('should resolve unsupported locale code to English', () => {
            const service = new TranslationService();

            // @ts-expect-error testing fallback behavior with an invalid locale
            const resolved = service.resolveLocale('xyz');

            expect(resolved).toBe(BASE_LOCALE);
        });

        it('should throw on fetch failure for unknown locale', async () => {
            mockBrowserLocale = 'en';
            const service = new TranslationService();
            await service.loadLocaleData();

            // 'fi' is a valid locale but not in our fixtures → fetch throws
            await expect(service.loadLocale('fi')).rejects.toThrow();
        });

        it('should return full lowercase locale code from getUILanguage()', async () => {
            const service = new TranslationService();

            expect(service.getUILanguage('en')).toBe('en');
            expect(service.getUILanguage('zh_CN')).toBe('zh_cn');
        });

        it('should return English base message from getBaseMessage()', async () => {
            const service = new TranslationService();
            await service.loadLocaleData();

            expect(service.getBaseMessage('about_title')).toBe('About');
            // Returns empty string for missing keys (safe for plural form parsing)
            expect(service.getBaseMessage('nonexistent')).toBe('');
        });

        it('should return "en" from getBaseUILanguage()', () => {
            const service = new TranslationService();
            expect(service.getBaseUILanguage()).toBe('en');
        });
    });
});
