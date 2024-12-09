import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { QuickConnectSetting } from '../../../common/constants';
import { translator } from '../../../common/translator';
import { rootStore } from '../../stores';
import { ControlsSelect } from '../ui/Controls';

export const QuickConnect = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const handleChange = async (value: QuickConnectSetting): Promise<void> => {
        await settingsStore.setQuickConnectSetting(value);
    };

    return (
        <ControlsSelect
            title={translator.getMessage('settings_quick_connect_title')}
            description={translator.getMessage('settings_quick_connect_subtitle')}
            value={settingsStore.quickConnect}
            options={[
                {
                    value: QuickConnectSetting.LastUsedLocation,
                    title: translator.getMessage('settings_quick_connect_last_used'),
                },
                {
                    value: QuickConnectSetting.FastestLocation,
                    title: translator.getMessage('settings_quick_connect_fastest'),
                },
            ]}
            onChange={handleChange}
        />
    );
});
