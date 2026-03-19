import browser from 'webextension-polyfill';

import { type MessagesJson, type FlattenedMessages } from './localeTypes';
import {
    type AvailableLocale,
    type LocalePreference,
    BASE_LOCALE,
    LANGUAGE_AUTO,
    AVAILABLE_LOCALES,
} from './localeConstants';
import { checkLocale } from './checkLocale';

/**
 * Stateless translation utility that loads locale files on demand, caches them,
 * and provides synchronous message lookup with English fallback.
 *
 * Contains no MobX dependencies and holds no locale state — suitable for any
 * extension context including the background script.  Callers (I18n, TranslationStore)
 * own the active locale and pass it as a parameter to lookup methods.
 */
export class TranslationService {
    /**
     * In-memory cache of loaded and flattened locale data.
     * Maps locale code → FlattenedMessages.
     */
    private localeCache: Map<AvailableLocale, FlattenedMessages> = new Map();

    /**
     * Flattens a raw MessagesJson object into a FlattenedMessages record.
     * Skips entries whose `.message` value is not a non-empty string.
     *
     * @param rawMessages Raw messages.json content.
     *
     * @returns Flattened key → message map.
     */
    private flattenMessages(rawMessages: MessagesJson): FlattenedMessages {
        const result: FlattenedMessages = {};

        const entries = Object.entries(rawMessages);
        for (let i = 0; i < entries.length; i += 1) {
            const [key, entry] = entries[i];
            if (entry && typeof entry.message === 'string' && entry.message.length > 0) {
                result[key] = entry.message;
            }
        }

        return result;
    }

    /**
     * Resolves a user preference into a concrete supported locale code.
     *
     * When preference is 'auto', uses the browser's UI language.
     * Falls back to BASE_LOCALE when the locale is not supported.
     *
     * @param localePreference User locale preference ('auto' or a locale code).
     *
     * @returns Resolved locale code from AVAILABLE_LOCALES, or BASE_LOCALE.
     */
    resolveLocale(localePreference: LocalePreference): AvailableLocale {
        const code = localePreference === LANGUAGE_AUTO
            ? browser.i18n.getUILanguage()
            : localePreference;

        const result = checkLocale(AVAILABLE_LOCALES, code);

        return result.suitable ? result.locale : BASE_LOCALE;
    }

    /**
     * Loads a locale file from extension assets, flattens it, and caches the result.
     * No-op if the locale is already cached.
     *
     * @param locale Locale code matching a folder in `_locales/`.
     *
     * @throws On fetch or parse failure — callers handle fallback.
     */
    async loadLocale(locale: AvailableLocale): Promise<void> {
        if (this.localeCache.has(locale)) {
            return;
        }

        const url = browser.runtime.getURL(`_locales/${locale}/messages.json`);
        const response = await fetch(url);
        const raw: MessagesJson = await response.json();
        const flattened = this.flattenMessages(raw);
        this.localeCache.set(locale, flattened);
    }

    /**
     * Loads the English base locale and the locale resolved from `preference`,
     * using the cache when possible.
     *
     * This is the single entry-point callers use instead of the former
     * stateful `init()` / `setLocalePreference()` methods.  The caller is
     * responsible for storing the returned locale.
     *
     * @param preference Persisted preference ('auto' or a locale code).
     *                   Defaults to 'auto' if not provided.
     *
     * @returns The resolved {@link AvailableLocale} that was loaded.
     */
    async loadLocaleData(preference?: LocalePreference): Promise<AvailableLocale> {
        const pref = preference || LANGUAGE_AUTO;

        await this.loadLocale(BASE_LOCALE);

        const resolved = this.resolveLocale(pref);

        if (resolved !== BASE_LOCALE) {
            await this.loadLocale(resolved);
        }

        return resolved;
    }

    /**
     * Returns the translated message for the given key in the specified locale.
     *
     * Lookup order:
     * 1. Requested locale's flattened messages
     * 2. If missing → return '' so `@adguard/translate` handles fallback with correct plural forms
     * 3. If key does not exist in the English base → throw Error
     *
     * @param locale The locale to look up the message in.
     * @param key Translation message key.
     *
     * @returns Translated message, or empty string if untranslated in the requested locale.
     *
     * @throws If the key does not exist in the English base messages.
     */
    getMessage(locale: AvailableLocale, key: string): string {
        const baseMessages = this.localeCache.get(BASE_LOCALE);
        const baseMessage = baseMessages?.[key];

        if (!baseMessage) {
            throw new Error(`There is no such key "${key}" in the messages`);
        }

        // When requested locale is the base locale, return the base message directly
        if (locale === BASE_LOCALE) {
            return baseMessage;
        }

        const currentMessages = this.localeCache.get(locale);
        const currentMessage = currentMessages?.[key];

        // Missing or skipped entry in requested locale → return empty string
        // so @adguard/translate falls back to base message with correct plural forms
        if (!currentMessage) {
            return '';
        }

        return currentMessage;
    }

    /**
     * Returns the UI language code for `@adguard/translate`.
     *
     * @param locale The locale code to convert.
     *
     * @returns Lowercase locale code matching the `AvailableLocales` enum
     *          in `@adguard/translate` (e.g. 'de', 'pt_br', 'zh_cn').
     */
    getUILanguage(locale: AvailableLocale): string {
        return locale.toLowerCase();
    }

    /**
     * Returns the English base message for the given key.
     * Returns an empty string if the key is not found, which signals
     * to `@adguard/translate` that no base message is available
     * (safe for plural form parsing).
     *
     * @param key Translation message key.
     *
     * @returns English base message, or empty string if not found.
     */
    getBaseMessage(key: string): string {
        const baseMessages = this.localeCache.get(BASE_LOCALE);
        return baseMessages?.[key] || '';
    }

    /**
     * Returns the base locale code.
     *
     * @returns The base locale code ('en').
     */
    getBaseUILanguage(): string {
        return BASE_LOCALE;
    }
}
