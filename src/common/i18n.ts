import browser from 'webextension-polyfill';

import { log } from './logger';
import { TranslationService } from './locale/TranslationService';
import { type AvailableLocale, type LocalePreference, BASE_LOCALE } from './locale/localeConstants';
import { type LocaleStore } from './locale/localeTypes';

/**
 * Internationalization facade with two operating modes:
 *
 * - **Standalone** (background, consent): holds a plain `currentLocale` field.
 *   `getMessage()` uses that field. No MobX in the import chain.
 * - **Store-connected** (popup, options): after {@link connectStore} is called,
 *   `getMessage()` reads `store.currentLocale` which is a MobX `@observable`,
 *   creating automatic dependency tracking for `observer` components.
 *
 * Each extension context (background, popup, options, consent) gets its own
 * instance of the underlying service.  Before {@link i18n.init} completes,
 * all methods fall back to `browser.i18n` (preserving current behaviour).
 */
class I18n {
    /**
     * Per-context TranslationService instance (stateless cache + lookup).
     */
    private translationService = new TranslationService();

    /**
     * Whether {@link init} has completed successfully.
     * Before this flag is set, all methods fall back to `browser.i18n`.
     */
    private initialized = false;

    /**
     * Connected locale store (UI contexts only).
     * When set, `getMessage()` / `getUILanguage()` read `store.currentLocale`
     * instead of the plain {@link currentLocale} field.
     */
    private store: LocaleStore | null = null;

    /**
     * Active locale in standalone mode (background, consent).
     * Ignored when a store is connected.
     */
    private currentLocale: AvailableLocale = BASE_LOCALE;

    /**
     * Creates and connects a {@link LocaleStore} so that `getMessage()` and
     * `getUILanguage()` read the store's observable `currentLocale`,
     * creating MobX dependency tracking for `observer` components.
     *
     * Accepts a **constructor** rather than importing `TranslationStore`
     * directly, because `TranslationStore` depends on MobX.  A direct
     * import would pull MobX into the background script's bundle, where
     * it is not needed and not wanted.
     *
     * Call this once in each UI context's `RootStore` constructor.
     *
     * @param StoreClass A class whose constructor accepts a `TranslationService`.
     *
     * @returns The created store instance.
     */
    connectStore<T extends LocaleStore>(
        StoreClass: new (service: TranslationService) => T,
    ): T {
        const store = new StoreClass(this.translationService);
        this.store = store;
        return store;
    }

    /**
     * Initializes the translation service with a saved language preference.
     * Must be called during startup of each extension context.
     *
     * In store-connected mode, delegates to `store.init()` so that the
     * store’s observables are updated atomically.  In standalone mode,
     * loads locale data directly and sets the plain `currentLocale` field.
     *
     * @param savedPreference Persisted preference ('auto' or a locale code). Defaults to 'auto'.
     */
    async init(savedPreference?: LocalePreference): Promise<void> {
        if (this.store) {
            await this.store.init(savedPreference);
        } else {
            try {
                this.currentLocale = await this.translationService.loadLocaleData(savedPreference);
            } catch (e) {
                log.warn('[vpn.I18n.init]: Failed to initialize, falling back to English', e);
                this.currentLocale = BASE_LOCALE;
            }
        }

        this.initialized = true;
    }

    /**
     * Changes the locale preference.
     *
     * In store-connected mode, delegates to `store.setLocalePreference()`.
     * In standalone mode, loads locale data directly and updates the plain field.
     *
     * @param preference 'auto' or a specific locale code (e.g. 'de').
     */
    async setLocalePreference(preference: LocalePreference): Promise<void> {
        if (this.store) {
            await this.store.setLocalePreference(preference);
        } else {
            try {
                this.currentLocale = await this.translationService.loadLocaleData(preference);
            } catch (e) {
                log.warn('[vpn.I18n.setLocalePreference]: Failed to set locale, falling back to English', e);
                this.currentLocale = BASE_LOCALE;
            }
        }
    }

    /**
     * Retrieves the localized message for the given key.
     *
     * When a store is connected, reads `store.currentLocale` which creates
     * a MobX dependency so that `observer` components re-render on locale change.
     * In standalone mode, reads the plain `currentLocale` field.
     *
     * Before {@link init} completes, falls back to `browser.i18n.getMessage()`.
     *
     * @param key The key corresponding to the message in the localization files.
     *
     * @returns The localized message, or an empty string if untranslated in the current locale.
     *
     * @throws If the key does not exist in the English base messages (after init).
     */
    getMessage(key: string): string {
        // Read locale first - when a store is connected this creates a MobX
        // dependency so the calling observer re-renders on locale change.
        const locale = this.store
            ? this.store.currentLocale
            : this.currentLocale;

        if (!this.initialized) {
            return browser.i18n.getMessage(key);
        }

        return this.translationService.getMessage(locale, key);
    }

    /**
     * Returns the UI language code for `@adguard/translate`.
     *
     * When a store is connected, reads `store.currentLocale` for MobX tracking.
     * Before {@link init} completes, falls back to `browser.i18n.getUILanguage()`.
     *
     * @returns Lowercase locale code matching the `AvailableLocales` enum
     *          in `@adguard/translate` (e.g. 'de', 'pt_br', 'zh_cn').
     */
    getUILanguage(): string {
        const locale = this.store
            ? this.store.currentLocale
            : this.currentLocale;

        if (!this.initialized) {
            return browser.i18n.getUILanguage().toLowerCase().replace('-', '_');
        }

        return this.translationService.getUILanguage(locale);
    }

    /**
     * Retrieves the base (English) message for the given key.
     *
     * Before {@link init} completes, falls back to `browser.i18n.getMessage()`.
     * After init, delegates to {@link TranslationService.getBaseMessage}.
     *
     * @param key The key corresponding to the message in the base messages.
     *
     * @returns The English base message, or empty string if not found.
     */
    getBaseMessage(key: string): string {
        if (!this.initialized) {
            // In tests, browser.i18n is mocked and returns empty strings.
            // Return the raw key so @adguard/translate has a fallback message
            // for top-level translator.getMessage() calls (e.g. dnsConstants.ts).
            if (process.env.NODE_ENV === 'test') {
                return key;
            }
            return browser.i18n.getMessage(key);
        }

        return this.translationService.getBaseMessage(key);
    }

    /**
     * Retrieves the base UI language code for `@adguard/translate`.
     *
     * @returns The base UI language code ('en').
     */
    getBaseUILanguage(): string {
        return BASE_LOCALE;
    }

    /**
     * Returns the internal {@link TranslationService} instance.
     *
     * Intended for tests that need direct access to the stateless service.
     *
     * @returns The per-context TranslationService instance.
     */
    getTranslationService(): TranslationService {
        return this.translationService;
    }
}

export const i18n = new I18n();
