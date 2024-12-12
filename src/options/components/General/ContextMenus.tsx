import React, { useContext } from 'react';
import { observer } from 'mobx-react';

// import { translator } from '../../../common/translator';
import { rootStore } from '../../stores';
import { ControlsSwitch } from '../ui/Controls';

export const ContextMenus = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { contextMenusEnabled } = settingsStore;

    const handleToggle = async (): Promise<void> => {
        await settingsStore.setContextMenusValue(!contextMenusEnabled);
    };

    return (
        <ControlsSwitch
            // FIXME: Update translation text
            // title={translator.getMessage('settings_context_menus_title')}
            title="Display AdGuard VPN in the browser context menu"
            // FIXME: Add translation text
            // description={translator.getMessage('settings_context_menus_description')}
            description="Manage VPN exclusions for a specific website"
            isActive={contextMenusEnabled}
            onToggle={handleToggle}
        />
    );
});
