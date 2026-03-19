import { describe, it, expect } from 'vitest';

import { buildLanguageOptions } from '../../../../src/options/components/General/Language';
import { LANGUAGE_AUTO, AVAILABLE_LOCALES, LANGUAGE_NAMES } from '../../../../src/common/locale/localeConstants';

const BROWSER_DEFAULT = 'Browser default';

describe('buildLanguageOptions', () => {
    it('should return auto option first when auto is selected', () => {
        const options = buildLanguageOptions(LANGUAGE_AUTO, BROWSER_DEFAULT);

        expect(options[0]).toEqual({
            value: LANGUAGE_AUTO,
            title: BROWSER_DEFAULT,
        });
    });

    it('should contain all available locales plus auto', () => {
        const options = buildLanguageOptions(LANGUAGE_AUTO, BROWSER_DEFAULT);

        expect(options).toHaveLength(AVAILABLE_LOCALES.length + 1);
    });

    it('should sort remaining languages alphabetically by native name when auto is selected', () => {
        const options = buildLanguageOptions(LANGUAGE_AUTO, BROWSER_DEFAULT);

        // Skip the first option (auto), check the rest is sorted
        const languageTitles = options.slice(1).map((opt) => opt.title);
        const sorted = [...languageTitles].sort((a, b) => String(a).localeCompare(String(b)));

        expect(languageTitles).toEqual(sorted);
    });

    it('should place selected language first and auto second when a specific locale is selected', () => {
        const options = buildLanguageOptions('de', BROWSER_DEFAULT);

        expect(options[0]).toEqual({
            value: 'de',
            title: LANGUAGE_NAMES.de,
        });
        expect(options[1]).toEqual({
            value: LANGUAGE_AUTO,
            title: BROWSER_DEFAULT,
        });
    });

    it('should not duplicate the selected language in the rest of the list', () => {
        const options = buildLanguageOptions('de', BROWSER_DEFAULT);

        const deOptions = options.filter((opt) => opt.value === 'de');
        expect(deOptions).toHaveLength(1);
    });

    it('should not duplicate auto in the rest of the list', () => {
        const options = buildLanguageOptions('de', BROWSER_DEFAULT);

        const autoOptions = options.filter((opt) => opt.value === LANGUAGE_AUTO);
        expect(autoOptions).toHaveLength(1);
    });

    it('should keep remaining languages sorted when a specific locale is selected', () => {
        const options = buildLanguageOptions('ja', BROWSER_DEFAULT);

        // Skip first two (selected + auto), check rest is sorted
        const restTitles = options.slice(2).map((opt) => opt.title);
        const sorted = [...restTitles].sort((a, b) => String(a).localeCompare(String(b)));

        expect(restTitles).toEqual(sorted);
    });
});
