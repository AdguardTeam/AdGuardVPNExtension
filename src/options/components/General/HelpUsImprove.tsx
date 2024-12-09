import React, { useContext } from 'react';
import { observer } from 'mobx-react';

// import { translator } from '../../../common/translator';
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
            // FIXME: Update translation text
            // title={translator.getMessage('settings_help_us_improve_title')}
            title="Send anonymous crash reports"
            // FIXME: Update translation text
            // description={translator.getMessage('settings_help_us_improve_description')}
            description="Notify AdGuard VPN developers if something goes wrong"
            active={helpUsImprove}
            onToggle={handleToggle}
        />
    );
});
