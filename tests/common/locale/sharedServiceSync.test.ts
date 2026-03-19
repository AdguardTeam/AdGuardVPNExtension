import {
    describe,
    it,
    expect,
    vi,
    beforeEach,
    type Mock,
} from 'vitest';

import { i18n } from '../../../src/common/i18n';
import { TranslationStore } from '../../../src/common/locale/TranslationStore';
import { type MessagesJson } from '../../../src/common/locale/localeTypes';

const EN_MESSAGES: MessagesJson = {
    about_title: { message: 'About' },
    greeting: { message: 'Hello' },
};

const DE_MESSAGES: MessagesJson = {
    about_title: { message: 'Über' },
    greeting: { message: 'Hallo' },
};

const FR_MESSAGES: MessagesJson = {
    about_title: { message: 'À propos' },
    greeting: { message: 'Bonjour' },
};

const LOCALE_FIXTURES: Record<string, MessagesJson> = {
    en: EN_MESSAGES,
    de: DE_MESSAGES,
    fr: FR_MESSAGES,
};

let mockBrowserLocale = 'en';

vi.mock('webextension-polyfill', () => ({
    default: {
        runtime: {
            getURL: (path: string): string => `chrome-extension://test-id/${path}`,
        },
        i18n: {
            getMessage: (key: string): string => EN_MESSAGES[key]?.message || '',
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

describe('i18n standalone mode (background / consent)', () => {
    it('should initialize and return correct messages without a store', async () => {
        await i18n.init('de');

        expect(i18n.getMessage('about_title')).toBe('Über');
        expect(i18n.getUILanguage()).toBe('de');
    });

    it('should switch locale via setLocalePreference in standalone mode', async () => {
        await i18n.init('en');
        expect(i18n.getMessage('greeting')).toBe('Hello');

        await i18n.setLocalePreference('de');
        expect(i18n.getMessage('greeting')).toBe('Hallo');
    });
});

describe('i18n store-connected mode (popup / options)', () => {
    it('should delegate init to the store when connected', async () => {
        const store = i18n.connectStore(TranslationStore);

        await i18n.init('de');

        expect(store.currentLocale).toBe('de');
        expect(store.userLocalePreference).toBe('de');
        expect(store.isLoading).toBe(false);
        expect(i18n.getMessage('about_title')).toBe('Über');
    });

    it('should update i18n.getMessage() after store.setLocalePreference() without manual sync', async () => {
        const store = i18n.connectStore(TranslationStore);

        await i18n.init('en');
        expect(i18n.getMessage('about_title')).toBe('About');

        await store.setLocalePreference('de');

        // i18n reads store.currentLocale — no syncFromService() needed
        expect(i18n.getMessage('about_title')).toBe('Über');
        expect(store.currentLocale).toBe('de');
    });

    it('should reflect store locale changes in getUILanguage()', async () => {
        const store = i18n.connectStore(TranslationStore);

        await i18n.init('en');
        expect(i18n.getUILanguage()).toBe('en');

        await store.setLocalePreference('de');
        expect(i18n.getUILanguage()).toBe('de');
    });

    it('should use cache when i18n.init and store share the same service', async () => {
        const store = i18n.connectStore(TranslationStore);

        await i18n.init('de');

        const fetchCountAfterInit = (global.fetch as Mock).mock.calls.length;

        // Switching back to a locale that was already loaded should not fetch again
        await store.setLocalePreference('en');
        await store.setLocalePreference('de');

        expect((global.fetch as Mock).mock.calls.length).toBe(fetchCountAfterInit);
        expect(store.currentLocale).toBe('de');
    });
});

describe('TranslationStore as sole state owner', () => {
    it('should own currentLocale, userLocalePreference, isLoading', async () => {
        const store = new TranslationStore();

        expect(store.currentLocale).toBe('en');
        expect(store.userLocalePreference).toBe('auto');
        expect(store.isLoading).toBe(false);

        await store.init('de');

        expect(store.currentLocale).toBe('de');
        expect(store.userLocalePreference).toBe('de');
        expect(store.isLoading).toBe(false);
    });

    it('should update observables on setLocalePreference', async () => {
        const store = new TranslationStore();
        await store.init('en');

        await store.setLocalePreference('de');

        expect(store.currentLocale).toBe('de');
        expect(store.userLocalePreference).toBe('de');
        expect(store.isLoading).toBe(false);
    });

    it('should fall back to English on load failure', async () => {
        const store = new TranslationStore();
        await store.init('en');

        // 'fi' is not in fixtures — loadLocaleData will throw
        await store.setLocalePreference('fi');

        expect(store.currentLocale).toBe('en');
        expect(store.isLoading).toBe(false);
    });
});
