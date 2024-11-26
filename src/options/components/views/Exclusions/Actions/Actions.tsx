import React from 'react';
import { observer } from 'mobx-react';

import { ActionsMenu } from './ActionsMenu';

export const Actions = observer(() => {
    return (
        <ActionsMenu
            onExportExclusionsClick={() => {}}
            onImportExclusionsClick={() => {}}
            onRemoveAllClick={() => {}}
        />
    );
});
