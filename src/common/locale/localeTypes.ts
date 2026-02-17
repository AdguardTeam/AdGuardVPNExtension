import { type AvailableLocale, type LocalePreference } from './localeConstants';

/**
 * Result of matching a locale code against available locales.
 *
 * Discriminated union: when `suitable` is `true`, `locale` is narrowed
 * to {@link AvailableLocale}.
 */
export type CheckLocaleResult =
    | {
        /**
         * A matching locale was found.
         */
        suitable: true;

        /**
         * The matched locale code (e.g., `'zh_CN'`).
         */
        locale: AvailableLocale;
    }
    | {
        /**
         * No matching locale was found.
         */
        suitable: false;

        /**
         * The normalized input that failed to match.
         */
        locale: string;
    };

/**
 * Represents an individual message entry in a messages.json file.
 */
export interface MessageEntry {
    /**
     * The translated text.
     */
    message: string;

    /**
     * Optional translator note describing the message context.
     */
    description?: string;

    /**
     * Optional Chrome extension placeholder definitions.
     */
    placeholders?: Record<string, { content: string }>;
}

/**
 * Represents the structure of a messages.json file.
 */
export type MessagesJson = {
    [key: string]: MessageEntry;
};

/**
 * Flattened format for efficient runtime lookup: key → translated text.
 */
export type FlattenedMessages = {
    [key: string]: string;
};

/**
 * Minimal contract that a locale state owner must satisfy.
 *
 * Used by the {@link I18n} facade to read the active locale without
 * importing the concrete {@link TranslationStore} class (which depends on MobX).
 * In UI contexts the store implements this interface; in the background
 * script no store is connected and I18n uses its own plain field instead.
 */
export interface LocaleStore {
    /**
     * The resolved locale code currently in use (e.g. 'de').
     */
    readonly currentLocale: AvailableLocale;

    /**
     * Initializes the store with a saved preference.
     *
     * @param savedPreference Persisted preference ('auto' or a locale code).
     */
    init(savedPreference?: LocalePreference): Promise<void>;

    /**
     * Changes the locale preference.
     *
     * @param preference 'auto' or a specific locale code (e.g. 'de').
     */
    setLocalePreference(preference: LocalePreference): Promise<void>;
}
