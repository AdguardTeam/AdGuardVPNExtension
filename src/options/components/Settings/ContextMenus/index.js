import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import rootStore from '../../../stores';

import Switch from '../../ui/Switch';
import { reactTranslator } from '../../../../common/reactTranslator';

const ContextMenus = observer(() => {
    const { settingsStore } = useContext(rootStore);

    const handleToggle = async (e) => {
        await settingsStore.setContextMenusValue(e.currentTarget.checked);
    };

    return (
        <>
            <div className="settings__group">
                <Switch
                    id="context-menus"
                    title={reactTranslator.getMessage('settings_context_menus_title')}
                    handleToggle={handleToggle}
                    checked={settingsStore.contextMenusEnabled}
                />
            </div>
        </>
    );
});

export default ContextMenus;
