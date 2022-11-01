import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { Switch } from '../../ui/Switch';
import { reactTranslator } from '../../../../common/reactTranslator';

export const ContextMenus = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { contextMenusEnabled } = settingsStore;

    const handleToggle = async (): Promise<void> => {
        await settingsStore.setContextMenusValue(!contextMenusEnabled);
    };

    return (
        <div className="settings__group">
            <Switch
                title={reactTranslator.getMessage('settings_context_menus_title')}
                handleToggle={handleToggle}
                checked={contextMenusEnabled}
            />
        </div>
    );
});
