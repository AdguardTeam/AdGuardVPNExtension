import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../../common/reactTranslator';
import { ExclusionsMode } from '../../../../common/exclusionsConstants';
import { rootStore } from '../../../stores';
import { Icon } from '../../ui/Icon';

import { ModeSelectorModal } from './ModeSelectorModal';

import './mode-selector.pcss';

export const ModeSelector = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const showWarning = exclusionsStore.currentMode === ExclusionsMode.Selective
        && exclusionsStore.exclusionsTree.children.length === 0;

    const handleClick = () => {
        exclusionsStore.setModeSelectorModalOpen(true);
    };

    const modeInfoOptions = {
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
    };

    const modeInfo = exclusionsStore.currentMode === ExclusionsMode.Regular
        ? reactTranslator.getMessage('settings_exclusion_general_mode_info', modeInfoOptions)
        : reactTranslator.getMessage('settings_exclusion_selective_mode_info', modeInfoOptions);

    return (
        <>
            {modeInfo}
            {showWarning && (
                <div className="mode-selector__warning">
                    {reactTranslator.getMessage('settings_exclusion_selective_mode_warning')}
                </div>
            )}
            <ModeSelectorModal />
        </>
    );
});
