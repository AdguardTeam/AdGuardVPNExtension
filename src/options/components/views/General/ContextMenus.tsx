import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { reactTranslator } from '../../../../common/reactTranslator';
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
            title={reactTranslator.getMessage('settings_context_menus_title')}
            value={contextMenusEnabled}
            onToggle={handleToggle}
        />
    );
});
