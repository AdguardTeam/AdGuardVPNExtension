import { describe, it, expect } from 'vitest';

import { AVAILABLE_LOCALES, LANGUAGE_NAMES } from '../../../src/common/locale/localeConstants';

describe('LANGUAGE_NAMES', () => {
    it('should have an entry for every available locale', () => {
        AVAILABLE_LOCALES.forEach((locale) => {
            expect(LANGUAGE_NAMES).toHaveProperty(locale);
        });
    });

    it('should not have entries for non-existent locales', () => {
        Object.keys(LANGUAGE_NAMES).forEach((key) => {
            expect(AVAILABLE_LOCALES).toContain(key);
        });
    });

    it('should have non-empty string values for all entries', () => {
        Object.entries(LANGUAGE_NAMES).forEach(([locale, name]) => {
            expect(name, `LANGUAGE_NAMES['${locale}'] should be a non-empty string`).toBeTruthy();
            expect(typeof name).toBe('string');
        });
    });
});
