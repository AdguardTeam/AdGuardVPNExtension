import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../../stores';
import { reactTranslator } from '../../../../../common/reactTranslator';
import { ExclusionsMode } from '../../../../../common/exclusionsConstants';
import { Icon } from '../../../ui/Icon';

import './mode-selector.pcss';

export const ModeSelectorButton = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const modeInfoKey = exclusionsStore.currentMode === ExclusionsMode.Regular
        ? 'settings_exclusion_general_mode_info'
        : 'settings_exclusion_selective_mode_info';

    const handleClick = () => {
        exclusionsStore.setModeSelectorModalOpen(true);
    };

    return (
        reactTranslator.getMessage(modeInfoKey, {
            span: (chunk: string) => (
                <button
                    type="button"
                    className="mode-selector__btn"
                    onClick={handleClick}
                >
                    {chunk}
                    <Icon name="pencil" className="mode-selector__btn-icon" />
                </button>
            ),
        })
    );
});
