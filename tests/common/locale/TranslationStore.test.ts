import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    type Mock,
} from 'vitest';

import { TranslationStore } from '../../../src/common/locale/TranslationStore';
import { LANGUAGE_AUTO } from '../../../src/common/locale/localeConstants';
import { type MessagesJson } from '../../../src/common/locale/localeTypes';

const EN_MESSAGES: MessagesJson = {
    about_title: { message: 'About' },
    greeting: { message: 'Hello' },
};

const DE_MESSAGES: MessagesJson = {
    about_title: { message: 'Über' },
    greeting: { message: 'Hallo' },
};

const LOCALE_FIXTURES: Record<string, MessagesJson> = {
    en: EN_MESSAGES,
    de: DE_MESSAGES,
};

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

beforeEach(() => {
    mockBrowserLocale = 'en';

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
 * NOTE!
 * Tests — only MobX-specific behavior (observable sync and delegation).
 * Core translation logic is tested in TranslationService.test.ts.
 */

describe('TranslationStore', () => {
    describe('observable state sync after init()', () => {
        it('should sync all observable fields after init with auto', async () => {
            mockBrowserLocale = 'de';
            const store = new TranslationStore();

            await store.init();

            expect(store.userLocalePreference).toBe(LANGUAGE_AUTO);
            expect(store.currentLocale).toBe('de');
            expect(store.isLoading).toBe(false);
        });

        it('should sync all observable fields after init with explicit locale', async () => {
            const store = new TranslationStore();

            await store.init('de');

            expect(store.userLocalePreference).toBe('de');
            expect(store.currentLocale).toBe('de');
            expect(store.isLoading).toBe(false);
        });
    });

    describe('observable state sync after setLocalePreference()', () => {
        it('should sync observables after switching locale', async () => {
            const store = new TranslationStore();
            await store.init();

            await store.setLocalePreference('de');

            expect(store.userLocalePreference).toBe('de');
            expect(store.currentLocale).toBe('de');
            expect(store.isLoading).toBe(false);
        });

        it('should sync observables after switching back to auto', async () => {
            mockBrowserLocale = 'de';
            const store = new TranslationStore();
            await store.init('de');

            await store.setLocalePreference(LANGUAGE_AUTO);

            expect(store.userLocalePreference).toBe(LANGUAGE_AUTO);
            expect(store.currentLocale).toBe('de');
            expect(store.isLoading).toBe(false);
        });
    });

    describe('delegation to TranslationService', () => {
        it('should delegate getMessage() to the service', async () => {
            const store = new TranslationStore();
            await store.init('de');

            expect(store.getMessage('about_title')).toBe('Über');
        });

        it('should delegate getUILanguage() to the service', async () => {
            const store = new TranslationStore();
            await store.init('de');

            expect(store.getUILanguage()).toBe('de');
        });

        it('should delegate getBaseMessage() to the service', async () => {
            const store = new TranslationStore();
            await store.init();

            expect(store.getBaseMessage('about_title')).toBe('About');
        });

        it('should delegate getBaseUILanguage() to the service', () => {
            const store = new TranslationStore();

            expect(store.getBaseUILanguage()).toBe('en');
        });
    });
});
