import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { ExclusionsModal } from '../ExclusionsModal';
import { rootStore } from '../../../../stores';
import { AddExclusionMode } from '../../../../stores/ExclusionsStore';
import { ServiceMode } from './ServiceMode/ServiceMode';
import { ManualMode } from './ManualMode/ManualMode';
import { reactTranslator } from '../../../../../common/reactTranslator';

import '../exclusions-modal.pcss';

export const AddExclusionModal = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const isOpen = exclusionsStore.addExclusionModalOpen;

    const onClose = () => {
        exclusionsStore.closeAddExclusionModal();
    };

    const onServiceModeClick = () => {
        exclusionsStore.setAddExclusionMode(AddExclusionMode.SERVICE);
    };

    const onManualModeClick = () => {
        exclusionsStore.setAddExclusionMode(AddExclusionMode.MANUAL);
    };

    const ModeSelectButtons = {
        service: {
            classname: classnames(
                'mode-select-button',
                { enabled: exclusionsStore.addExclusionMode === AddExclusionMode.SERVICE },
            ),
        },
        manual: {
            classname: classnames(
                'mode-select-button',
                { enabled: exclusionsStore.addExclusionMode === AddExclusionMode.MANUAL },
            ),
        },
    };

    // FIXME add screens to handle cases:
    //  1. when exclusions were not received from the backend
    //  2. or when exclusions were not found?
    const MODE_MAP = {
        [AddExclusionMode.SERVICE]: () => <ServiceMode />,
        [AddExclusionMode.MANUAL]: () => <ManualMode />,
    };

    const mode = MODE_MAP[exclusionsStore.addExclusionMode];

    return (
        <ExclusionsModal
            isOpen={isOpen}
            closeModal={onClose}
            title={reactTranslator.getMessage('settings_exclusion_add_website')}
        >
            <div className="modal__mode-selectors">
                <button
                    onClick={onServiceModeClick}
                    type="button"
                    className={ModeSelectButtons.service.classname}
                >
                    {reactTranslator.getMessage('settings_exclusion_add_website')}
                </button>
                <button
                    onClick={onManualModeClick}
                    type="button"
                    className={ModeSelectButtons.manual.classname}
                >
                    {reactTranslator.getMessage('settings_exclusion_add_manually')}
                </button>
            </div>
            <div className="modal__mode">
                {mode()}
            </div>
        </ExclusionsModal>
    );
});
