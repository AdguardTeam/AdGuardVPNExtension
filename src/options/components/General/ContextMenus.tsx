import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { translator } from '../../../common/translator';
import { rootStore } from '../../stores';
import { ControlsSwitch } from '../ui/Controls';
import { Prefs } from '../../../common/prefs';

export const ContextMenus = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { contextMenusEnabled } = settingsStore;

    const handleToggle = async (): Promise<void> => {
        await settingsStore.setContextMenusValue(!contextMenusEnabled);
    };

    /**
     * Oculus Browser does not support context menus yet (AG-44721).
     * Remove this check when it will be available.
     */
    if (Prefs.isOculus()) {
        return null;
    }

    return (
        <ControlsSwitch
            title={translator.getMessage('settings_context_menus_title')}
            description={translator.getMessage('settings_context_menus_description')}
            isActive={contextMenusEnabled}
            onToggle={handleToggle}
        />
    );
});
