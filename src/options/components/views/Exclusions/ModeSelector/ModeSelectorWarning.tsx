import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../stores';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { ExclusionsMode } from '../../../../../common/exclusionsConstants';

export const ModeSelectorWarning = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    if (
        exclusionsStore.currentMode !== ExclusionsMode.Selective
        || exclusionsStore.exclusionsTree.children.length !== 0
    ) {
        return null;
    }

    return (
        <div className="mode-selector__warning">
            {reactTranslator.getMessage('settings_exclusion_selective_mode_warning')}
        </div>
    );
});
