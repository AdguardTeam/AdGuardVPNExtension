import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import Checkbox from '../Checkbox';

const List = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const { exclusionsCurrentMode } = settingsStore;
    const exclusions = settingsStore.exclusionsByType(exclusionsCurrentMode);

    const handleRemove = (id) => async () => {
        await settingsStore.removeFromExclusions(exclusionsCurrentMode, id);
    };

    const handleToggle = (id) => async () => {
        await settingsStore.toggleExclusion(exclusionsCurrentMode, id);
    };

    const handleRename = (id) => async (name) => {
        await settingsStore.renameExclusion(exclusionsCurrentMode, id, name);
    };

    return (
        <div className="settings__list">
            {exclusions.map(({ id, hostname, enabled }) => (
                <div className="settings__list-item" key={id}>
                    <Checkbox
                        id={id}
                        label={hostname}
                        checked={enabled}
                        handleToggle={handleToggle(id)}
                        handleRename={handleRename(id)}
                        handleRemove={handleRemove(id)}
                    />
                </div>
            ))}
        </div>
    );
});

export default List;
