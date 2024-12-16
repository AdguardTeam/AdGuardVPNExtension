import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../common/translator';
import { rootStore } from '../../stores';
import { ControlsSwitch } from '../ui/Controls';

export const HelpUsImprove = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { helpUsImprove } = settingsStore;

    const handleToggle = async (): Promise<void> => {
        await settingsStore.setHelpUsImproveValue(!helpUsImprove);
    };

    return (
        <ControlsSwitch
            title={translator.getMessage('settings_help_us_improve_title')}
            description={translator.getMessage('settings_help_us_improve_description')}
            isActive={helpUsImprove}
            onToggle={handleToggle}
        />
    );
});
