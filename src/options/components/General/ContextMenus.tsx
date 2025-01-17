import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../common/translator';
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
            title={translator.getMessage('settings_context_menus_title')}
            description={translator.getMessage('settings_context_menus_description')}
            isActive={contextMenusEnabled}
            onToggle={handleToggle}
        />
    );
});
