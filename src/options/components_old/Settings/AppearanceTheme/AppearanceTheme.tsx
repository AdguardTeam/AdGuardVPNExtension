import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { AppearanceTheme } from '../../../../common/constants';
import { rootStore } from '../../../stores';
import { Select } from '../../ui/Select';
import { reactTranslator } from '../../../../common/reactTranslator';

export const AppearanceThemeSetting = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const handleSetAppearanceTheme = async (value: AppearanceTheme): Promise<void> => {
        await settingsStore.setAppearanceTheme(value);
    };

    const THEMES = [
        {
            id: AppearanceTheme.System,
            title: reactTranslator.getMessage('settings_theme_system'),
        },
        {
            id: AppearanceTheme.Dark,
            title: reactTranslator.getMessage('settings_theme_dark'),
        },
        {
            id: AppearanceTheme.Light,
            title: reactTranslator.getMessage('settings_theme_light'),
        },
    ];

    return (
        <div className="settings__group">
            <div className="settings__item">
                <div className="settings__item-content">
                    <div className="settings__item-title">
                        {reactTranslator.getMessage('settings_theme_label')}
                    </div>
                </div>
                <Select
                    options={THEMES}
                    currentValue={settingsStore.appearanceTheme}
                    optionChange={handleSetAppearanceTheme}
                />
            </div>
        </div>
    );
});
