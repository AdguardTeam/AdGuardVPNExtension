import React from 'react';

import { reactTranslator } from '../../../../../common/reactTranslator';
import { Select } from '../../../ui/Select';

enum Action {
    Default = 'default',
    Export = 'export',
    Import = 'import',
    Remove = 'remove',
}

export interface ActionsMenuProps {
    onExportExclusionsClick: () => void;
    onImportExclusionsClick: () => void;
    onRemoveAllClick: () => void;
}

export function ActionsMenu({
    onExportExclusionsClick,
    onImportExclusionsClick,
    onRemoveAllClick,
}: ActionsMenuProps) {
    const handleChange = (action: Action) => {
        switch (action) {
            case Action.Export: {
                onExportExclusionsClick();
                break;
            }
            case Action.Import: {
                onImportExclusionsClick();
                break;
            }
            case Action.Remove: {
                onRemoveAllClick();
                break;
            }
            default: break;
        }
    };

    return (
        <Select
            variant="dimmed"
            value={Action.Default}
            options={[
                {
                    value: Action.Default,
                    title: reactTranslator.getMessage('settings_exclusion_actions'),
                    skip: true,
                },
                {
                    value: Action.Export,
                    title: reactTranslator.getMessage('settings_exclusions_action_export'),
                },
                {
                    value: Action.Import,
                    title: reactTranslator.getMessage('settings_exclusions_action_import'),
                },
                {
                    value: Action.Remove,
                    title: reactTranslator.getMessage('settings_exclusions_action_remove_all'),
                },
            ]}
            onChange={handleChange}
        />
    );
}
