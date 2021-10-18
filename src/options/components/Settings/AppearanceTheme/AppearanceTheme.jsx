import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { APPEARANCE_THEMES } from '../../../../lib/constants';
import { rootStore } from '../../../stores';
import { Select } from '../../ui/Select';
import { reactTranslator } from '../../../../common/reactTranslator';

export const AppearanceTheme = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const handleSetAppearanceTheme = async (server) => {
        await settingsStore.setAppearanceTheme(server);
    };

    const THEMES = {
        [APPEARANCE_THEMES.SYSTEM]: {
            title: reactTranslator.getMessage('settings_theme_system'),
        },
        [APPEARANCE_THEMES.DARK]: {
            title: reactTranslator.getMessage('settings_theme_dark'),
        },
        [APPEARANCE_THEMES.LIGHT]: {
            title: reactTranslator.getMessage('settings_theme_light'),
        },
    };

    return (
        <div className="settings__group">
            <div className="settings__item settings__appearance-theme">
                <div>
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
