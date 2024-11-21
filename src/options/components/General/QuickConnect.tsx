import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { QuickConnectSetting } from '../../../common/constants';
import { rootStore } from '../../stores';
import { reactTranslator } from '../../../common/reactTranslator';
import { ControlsSelect } from '../ui/Controls';

export const QuickConnect = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const handleChange = async (value: QuickConnectSetting): Promise<void> => {
        await settingsStore.setQuickConnectSetting(value);
    };

    return (
        <ControlsSelect
            title={reactTranslator.getMessage('settings_quick_connect_title')}
            description={reactTranslator.getMessage('settings_quick_connect_subtitle')}
            value={settingsStore.quickConnect}
            options={[
                {
                    value: QuickConnectSetting.LastUsedLocation,
                    title: reactTranslator.getMessage('settings_quick_connect_last_used'),
                },
                {
                    value: QuickConnectSetting.FastestLocation,
                    title: reactTranslator.getMessage('settings_quick_connect_fastest'),
                },
            ]}
            onChange={handleChange}
        />
    );
});
