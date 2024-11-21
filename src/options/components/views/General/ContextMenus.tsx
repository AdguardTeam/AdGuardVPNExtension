import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { ControlsSwitch } from '../../ui/Controls';

export const ContextMenus = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { contextMenusEnabled } = settingsStore;

    const handleToggle = async (): Promise<void> => {
        await settingsStore.setContextMenusValue(!contextMenusEnabled);
    };

    // FIXME: Translation
    return (
        <ControlsSwitch
            title="Display AdGuard VPN in the browser context menu"
            description="Manage VPN exclusions for a specific website"
            value={contextMenusEnabled}
            onToggle={handleToggle}
        />
    );
});
