import { describe, it, expect } from 'vitest';

import { checkLocale } from '../../../src/common/locale/checkLocale';
import { AVAILABLE_LOCALES } from '../../../src/common/locale/localeConstants';

describe('checkLocale', () => {
    describe('exact matches', () => {
        it.each(AVAILABLE_LOCALES)('should match "%s" exactly', (locale) => {
            const result = checkLocale(AVAILABLE_LOCALES, locale);
            expect(result).toEqual({ suitable: true, locale });
        });
    });

    describe('hyphen to underscore conversion', () => {
        it.each([
            ['zh-CN', 'zh_CN'],
            ['zh-TW', 'zh_TW'],
            ['pt-BR', 'pt_BR'],
            ['pt-PT', 'pt_PT'],
        ])('should convert "%s" to "%s"', (input, expected) => {
            const result = checkLocale(AVAILABLE_LOCALES, input);
            expect(result).toEqual({ suitable: true, locale: expected });
        });
    });

    describe('case insensitive matching', () => {
        it.each([
            ['EN', 'en'],
            ['De', 'de'],
            ['ZH_CN', 'zh_CN'],
            ['PT_BR', 'pt_BR'],
            ['Ja', 'ja'],
        ])('should match "%s" to "%s"', (input, expected) => {
            const result = checkLocale(AVAILABLE_LOCALES, input);
            expect(result).toEqual({ suitable: true, locale: expected });
        });
    });

    describe('regional fallback to base language', () => {
        it.each([
            ['en-US', 'en'],
            ['de-AT', 'de'],
            ['fr-CA', 'fr'],
            ['en-GB', 'en'],
            ['es-419', 'es'],
            ['ja-JP', 'ja'],
        ])('should fall back "%s" to "%s"', (input, expected) => {
            const result = checkLocale(AVAILABLE_LOCALES, input);
            expect(result).toEqual({ suitable: true, locale: expected });
        });
    });

    describe('base language prefix fallback', () => {
        it('should match "pt" to first pt_ locale in sorted list', () => {
            const result = checkLocale(AVAILABLE_LOCALES, 'pt');
            expect(result.suitable).toBe(true);
            expect(result.locale).toMatch(/^pt_/);
        });

        it('should match "zh" to first zh_ locale in sorted list', () => {
            const result = checkLocale(AVAILABLE_LOCALES, 'zh');
            expect(result.suitable).toBe(true);
            expect(result.locale).toMatch(/^zh_/);
        });
    });

    describe('three-part BCP 47 codes', () => {
        it('should resolve "zh-Hant-TW" to zh_TW', () => {
            const result = checkLocale(AVAILABLE_LOCALES, 'zh-Hant-TW');
            expect(result).toEqual({ suitable: true, locale: 'zh_TW' });
        });

        it('should resolve "zh-Hans-CN" to zh_CN', () => {
            const result = checkLocale(AVAILABLE_LOCALES, 'zh-Hans-CN');
            expect(result).toEqual({ suitable: true, locale: 'zh_CN' });
        });

        it('should resolve "sr-Latn-RS" to sr via base language fallback', () => {
            const result = checkLocale(AVAILABLE_LOCALES, 'sr-Latn-RS');
            expect(result).toEqual({ suitable: true, locale: 'sr' });
        });
    });

    describe('script subtag fallback', () => {
        it('should resolve "sr-Latn" to sr', () => {
            const result = checkLocale(AVAILABLE_LOCALES, 'sr-Latn');
            expect(result).toEqual({ suitable: true, locale: 'sr' });
        });

        it('should resolve "sr-Cyrl" to sr', () => {
            const result = checkLocale(AVAILABLE_LOCALES, 'sr-Cyrl');
            expect(result).toEqual({ suitable: true, locale: 'sr' });
        });

        it('should resolve "zh-HK" to first zh_ locale via prefix match', () => {
            const result = checkLocale(AVAILABLE_LOCALES, 'zh-HK');
            expect(result.suitable).toBe(true);
            expect(result.locale).toMatch(/^zh_/);
        });
    });

    describe('no match found', () => {
        it('should return suitable: false for unknown locale', () => {
            const result = checkLocale(AVAILABLE_LOCALES, 'xyz');
            expect(result).toEqual({ suitable: false, locale: 'xyz' });
        });

        it('should return suitable: false for unknown regional locale', () => {
            const result = checkLocale(AVAILABLE_LOCALES, 'xx-YY');
            expect(result).toEqual({ suitable: false, locale: 'xx_yy' });
        });
    });

    describe('null and empty input', () => {
        it('should handle null gracefully', () => {
            const result = checkLocale(AVAILABLE_LOCALES, null);
            expect(result).toEqual({ suitable: false, locale: '' });
        });

        it('should handle empty string gracefully', () => {
            const result = checkLocale(AVAILABLE_LOCALES, '');
            expect(result).toEqual({ suitable: false, locale: '' });
        });
    });

    describe('empty available locales', () => {
        it('should return suitable: false when no locales are available', () => {
            const result = checkLocale([], 'en');
            expect(result).toEqual({ suitable: false, locale: 'en' });
        });
    });
});
