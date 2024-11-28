import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../common/reactTranslator';
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
            title={reactTranslator.getMessage('settings_help_us_improve_title')}
            description={reactTranslator.getMessage('settings_help_us_improve_description')}
            value={helpUsImprove}
            onToggle={handleToggle}
        />
    );
});
