import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { QuickConnectSetting } from '../../../../common/constants';
import { rootStore } from '../../../stores';
import { Select } from '../../ui/Select';
import { reactTranslator } from '../../../../common/reactTranslator';

export const QuickConnect = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const handleChangeSetting = async (value: QuickConnectSetting): Promise<void> => {
        await settingsStore.setQuickConnectSetting(value);
    };

    const options = [
        {
            id: QuickConnectSetting.LastUsedLocation,
            title: reactTranslator.getMessage('settings_quick_connect_last_used'),
        },
        {
            id: QuickConnectSetting.FastestLocation,
            title: reactTranslator.getMessage('settings_quick_connect_fastest'),
        },
    ];

    return (
        <div className="settings__group">
            <div className="settings__item">
                <div className="settings__item-content">
                    <div className="settings__item-title">
                        {reactTranslator.getMessage('settings_quick_connect_title')}
                    </div>
                    <div className="settings__item-subtitle">
                        {reactTranslator.getMessage('settings_quick_connect_subtitle')}
                    </div>
                </div>
                <Select
                    options={options}
                    currentValue={settingsStore.quickConnect}
                    optionChange={handleChangeSetting}
                />
            </div>
        </div>
    );
});
