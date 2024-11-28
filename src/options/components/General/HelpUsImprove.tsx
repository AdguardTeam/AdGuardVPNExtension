import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { ControlsSwitch } from '../ui/Controls';

export const HelpUsImprove = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { helpUsImprove } = settingsStore;

    const handleToggle = async (): Promise<void> => {
        await settingsStore.setHelpUsImproveValue(!helpUsImprove);
    };

    // FIXME: Translation
    return (
        <ControlsSwitch
            title="Send anonymous crash reports"
            description="Notify AdGuard VPN developers if something goes wrong"
            value={helpUsImprove}
            onToggle={handleToggle}
        />
    );
});
