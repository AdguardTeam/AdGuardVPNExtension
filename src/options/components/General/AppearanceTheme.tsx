import { observer } from 'mobx-react';
import React, { useContext } from 'react';

import { AppearanceTheme as AppearanceThemeEnum } from '../../../common/constants';
import { reactTranslator } from '../../../common/reactTranslator';
import { rootStore } from '../../stores';
import { ControlsSelect } from '../ui/Controls';

export const AppearanceTheme = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const handleChange = async (value: AppearanceThemeEnum): Promise<void> => {
        await settingsStore.setAppearanceTheme(value);
    };

    return (
        <ControlsSelect
            title={reactTranslator.getMessage('settings_theme_label')}
            value={settingsStore.appearanceTheme}
            options={[
                {
                    value: AppearanceThemeEnum.System,
                    title: reactTranslator.getMessage('settings_theme_system'),
                },
                {
                    value: AppearanceThemeEnum.Dark,
                    title: reactTranslator.getMessage('settings_theme_dark'),
                },
                {
                    value: AppearanceThemeEnum.Light,
                    title: reactTranslator.getMessage('settings_theme_light'),
                },
            ]}
            onChange={handleChange}
        />
    );
});
