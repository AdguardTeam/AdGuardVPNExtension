import { type AvailableLocale } from './localeConstants';
import { type CheckLocaleResult } from './localeTypes';

/**
 * Matches a browser locale code to one of the supported locales.
 *
 * Resolution order:
 * 1. Normalize input (lowercase, hyphens → underscores)
 * 2. Exact match against available locales
 * 3. First two segments match (for 3-part BCP 47 codes like zh-Hant-TW → zh_TW)
 * 4. Base language exact match (e.g., en-GB → en)
 * 5. Base language prefix match (e.g., zh → zh_CN)
 *
 * @param availableLocales List of supported locale codes (e.g., from AVAILABLE_LOCALES).
 * @param locale Browser locale code to resolve (e.g., 'en-US', 'zh-CN').
 *
 * @returns Result indicating whether a match was found and the resolved locale code.
 *
 * @example
 * checkLocale(['en', 'zh_CN'], 'zh-CN')  // { suitable: true, locale: 'zh_CN' }
 * checkLocale(['en', 'zh_CN'], 'en-GB')  // { suitable: true, locale: 'en' }
 * checkLocale(['en', 'zh_CN'], 'xyz')    // { suitable: false, locale: 'xyz' }
 */
export function checkLocale(
    availableLocales: AvailableLocale[],
    locale: string | null,
): CheckLocaleResult {
    if (!locale) {
        return { suitable: false, locale: '' };
    }

    const normalized = locale.toLowerCase().replace(/-/g, '_');

    // Build a lowercase → original lookup map
    const lookupMap = availableLocales.reduce((map, available) => {
        map.set(available.toLowerCase(), available);
        return map;
    }, new Map<string, AvailableLocale>());

    // 1. Exact match
    const exactMatch = lookupMap.get(normalized);
    if (exactMatch) {
        return { suitable: true, locale: exactMatch };
    }

    const parts = normalized.split('_');

    // 2. For 3-part BCP 47 codes (e.g., zh_hant_tw):
    //    Try first+second (zh_hant), then first+last (zh_tw) to skip the script subtag
    if (parts.length >= 3) {
        const firstSecond = `${parts[0]}_${parts[1]}`;
        const firstSecondMatch = lookupMap.get(firstSecond);
        if (firstSecondMatch) {
            return { suitable: true, locale: firstSecondMatch };
        }

        const firstLast = `${parts[0]}_${parts[parts.length - 1]}`;
        const firstLastMatch = lookupMap.get(firstLast);
        if (firstLastMatch) {
            return { suitable: true, locale: firstLastMatch };
        }
    }

    // 3. Base language exact match (e.g., en_gb → en)
    const baseMatch = lookupMap.get(parts[0]);
    if (baseMatch) {
        return { suitable: true, locale: baseMatch };
    }

    // 4. Base language prefix match (e.g., zh → zh_CN)
    const prefix = `${parts[0]}_`;
    const prefixMatch = availableLocales.find(
        (available) => available.toLowerCase().startsWith(prefix),
    );
    if (prefixMatch) {
        return { suitable: true, locale: prefixMatch };
    }

    // No match found
    return { suitable: false, locale: normalized };
}
