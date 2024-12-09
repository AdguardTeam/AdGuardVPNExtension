import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { AppearanceTheme } from '../../../common/constants';
import { translator } from '../../../common/translator';
import { rootStore } from '../../stores';
import { ControlsSelect } from '../ui/Controls';

export const Theme = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const handleChange = async (value: AppearanceTheme): Promise<void> => {
        await settingsStore.setAppearanceTheme(value);
    };

    return (
        <ControlsSelect
            title={translator.getMessage('settings_theme_label')}
            value={settingsStore.appearanceTheme}
            options={[
                {
                    value: AppearanceTheme.System,
                    title: translator.getMessage('settings_theme_system'),
                },
                {
                    value: AppearanceTheme.Dark,
                    title: translator.getMessage('settings_theme_dark'),
                },
                {
                    value: AppearanceTheme.Light,
                    title: translator.getMessage('settings_theme_light'),
                },
            ]}
            onChange={handleChange}
        />
    );
});
