import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../common/reactTranslator';
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
            title={reactTranslator.getMessage('settings_context_menus_title')}
            description={reactTranslator.getMessage('settings_context_menus_description')}
            value={contextMenusEnabled}
            onToggle={handleToggle}
        />
    );
});
