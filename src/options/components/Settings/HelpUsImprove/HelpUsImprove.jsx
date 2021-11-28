import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { Switch } from '../../ui/Switch';
import { reactTranslator } from '../../../../common/reactTranslator';

export const HelpUsImprove = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const handleToggle = async (e) => {
        await settingsStore.setHelpUsImproveValue(e.currentTarget.checked);
    };

    return (
        <div className="settings__group">
            <Switch
                id="help-us-improve"
                title={reactTranslator.getMessage('settings_help_us_improve_title')}
                desc={reactTranslator.getMessage('settings_help_us_improve_description')}
                handleToggle={handleToggle}
                checked={settingsStore.helpUsImprove}
            />
        </div>
    );
});
