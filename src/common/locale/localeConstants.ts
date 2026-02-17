import * as v from 'valibot';

import twosky from '../../../.twosky.json';

/**
 * Locale code derived from the `.twosky.json` languages object.
 */
export type AvailableLocale = keyof typeof twosky[0]['languages'];

/**
 * Base locale used as fallback when translations are missing.
 */
export const BASE_LOCALE = 'en';

/**
 * Sentinel value meaning "use browser language" (auto-detect).
 */
export const LANGUAGE_AUTO = 'auto';

/**
 * A locale preference: either a specific locale code or `'auto'` for browser default.
 */
export type LocalePreference = AvailableLocale | typeof LANGUAGE_AUTO;

/**
 * All supported locale codes, derived from `.twosky.json` languages.
 * Sorted alphabetically.
 */
export const AVAILABLE_LOCALES = (Object.keys(twosky[0].languages) as AvailableLocale[]).sort();

/**
 * Schema that validates a raw string as a known locale or `'auto'`.
 * Falls back to {@link LANGUAGE_AUTO} for unrecognized values.
 */
const localePreferenceSchema = v.fallback(
    v.picklist([LANGUAGE_AUTO, ...AVAILABLE_LOCALES]),
    LANGUAGE_AUTO,
);

/**
 * Validates a raw string from storage and returns a safe {@link LocalePreference}.
 * Returns {@link LANGUAGE_AUTO} if the value is not a known locale.
 *
 * @param value Raw string read from persistent storage.
 * @returns A valid {@link LocalePreference}.
 */
export function toLocalePreference(value: string): LocalePreference {
    return v.parse(localePreferenceSchema, value);
}

/**
 * Maps each supported locale code to its native language name.
 * Used for displaying the language selector dropdown.
 */
export const LANGUAGE_NAMES: Record<AvailableLocale, string> = {
    ar: 'العربية',
    be: 'Беларуская',
    bg: 'Български',
    ca: 'Català',
    cs: 'Čeština',
    da: 'Dansk',
    de: 'Deutsch',
    el: 'Ελληνικά',
    en: 'English',
    es: 'Español',
    fa: 'فارسی',
    fi: 'Suomi',
    fr: 'Français',
    he: 'עברית',
    hr: 'Hrvatski',
    hu: 'Magyar',
    hy: 'Հայերեն',
    id: 'Bahasa Indonesia',
    it: 'Italiano',
    ja: '日本語',
    ko: '한국어',
    lt: 'Lietuvių',
    mk: 'Македонски',
    ms: 'Bahasa Melayu',
    nb: 'Norsk bokmål',
    nl: 'Nederlands',
    pl: 'Polski',
    pt_BR: 'Português (Brasil)',
    pt_PT: 'Português (Portugal)',
    ro: 'Română',
    ru: 'Русский',
    sk: 'Slovenčina',
    sl: 'Slovenščina',
    sr: 'Српски',
    sv: 'Svenska',
    tr: 'Türkçe',
    uk: 'Українська',
    vi: 'Tiếng Việt',
    zh_CN: '简体中文',
    zh_TW: '繁體中文',
};
