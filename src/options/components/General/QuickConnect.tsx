import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import { QuickConnectSetting } from '../../../common/constants';
import { translator } from '../../../common/translator';
import { rootStore } from '../../stores';
import { ControlsSelect } from '../ui/Controls';

export const QuickConnect = observer(() => {
    const { profilesStore, telemetryStore } = useContext(rootStore);

    const quickConnect = profilesStore.quickConnectCache[profilesStore.activeProfileId];

    const handleChange = async (value: QuickConnectSetting): Promise<void> => {
        telemetryStore.sendCustomEvent(
            value === QuickConnectSetting.LastUsedLocation
                ? TelemetryActionName.LastQuickConnectClick
                : TelemetryActionName.FastestQuickConnectClick,
            TelemetryScreenName.GeneralSettingsScreen,
        );

        await profilesStore.updateQuickConnectCache(profilesStore.activeProfileId, value);
    };

    const handleVisibilityChange = (isActive: boolean): void => {
        if (isActive) {
            telemetryStore.sendCustomEvent(
                TelemetryActionName.QuickConnectClick,
                TelemetryScreenName.GeneralSettingsScreen,
            );
        }
    };

    return (
        <ControlsSelect
            title={translator.getMessage('settings_quick_connect_title')}
            description={translator.getMessage('settings_quick_connect_subtitle')}
            value={quickConnect}
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
            onVisibilityChange={handleVisibilityChange}
        />
    );
});
