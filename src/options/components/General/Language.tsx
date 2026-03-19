import React, { useContext, useMemo } from 'react';
import { observer } from 'mobx-react';

import {
    LANGUAGE_AUTO,
    LANGUAGE_NAMES,
    AVAILABLE_LOCALES,
    type LocalePreference,
} from '../../../common/locale';
import { translator } from '../../../common/translator';
import { log } from '../../../common/logger';
import { rootStore } from '../../stores';
import { ControlsSelect } from '../ui/Controls';
import { type SelectOptionItem } from '../../../common/components/Select';

/**
 * Builds the language options array with ordering:
 * (1) currently selected item first,
 * (2) "Browser default" second (if not already selected),
 * (3) remaining languages sorted alphabetically by native name.
 *
 * @param selectedLanguage Current language preference.
 * @param browserDefaultTitle Translated label for the "Browser default" option.
 * @returns Ordered array of select options.
 */
export function buildLanguageOptions(
    selectedLanguage: LocalePreference,
    browserDefaultTitle: string,
): SelectOptionItem<LocalePreference>[] {
    const autoOption: SelectOptionItem<LocalePreference> = {
        value: LANGUAGE_AUTO,
        title: browserDefaultTitle,
    };

    const sortedLocales = [...AVAILABLE_LOCALES].sort(
        (a, b) => LANGUAGE_NAMES[a].localeCompare(LANGUAGE_NAMES[b]),
    );

    const languageOptions: SelectOptionItem<LocalePreference>[] = sortedLocales.map((locale) => ({
        value: locale,
        title: LANGUAGE_NAMES[locale],
    }));

    const allOptions = [autoOption, ...languageOptions];

    if (selectedLanguage === LANGUAGE_AUTO) {
        // "Browser default" is selected — it's already first, rest follows
        return allOptions;
    }

    // Move the selected language to the top, "Browser default" second
    const selected = allOptions.find((opt) => opt.value === selectedLanguage);

    if (!selected) {
        return allOptions;
    }

    const rest = allOptions.filter(
        (opt) => opt.value !== selectedLanguage && opt.value !== LANGUAGE_AUTO,
    );

    return [selected, autoOption, ...rest];
}

/**
 * Language selector for the General settings section.
 *
 * Renders a dropdown with "Browser default" plus all supported languages
 * (native names). Selecting a new language saves the preference via the
 * background script, updates the local {@link TranslationStore}, and triggers
 * a reactive re-render of all translated strings — no page reload needed.
 */
export const Language = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const browserDefaultTitle = translator.getMessage('settings_language_browser_default');

    const options = useMemo(
        () => buildLanguageOptions(settingsStore.selectedLanguage, browserDefaultTitle),
        [settingsStore.selectedLanguage, browserDefaultTitle],
    );

    const handleChange = async (value: LocalePreference): Promise<void> => {
        if (value === settingsStore.selectedLanguage) {
            return;
        }

        try {
            await settingsStore.changeLanguage(value);
        } catch (e) {
            log.error('[vpn.Language]: Failed to set interface language', e);
        }
    };

    return (
        <ControlsSelect
            title={translator.getMessage('settings_language_label')}
            value={settingsStore.selectedLanguage}
            options={options}
            onChange={handleChange}
        />
    );
});
