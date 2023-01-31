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
        exclusionsStore.setAddExclusionMode(AddExclusionMode.Service);
    };

    const onManualModeClick = () => {
        exclusionsStore.setAddExclusionMode(AddExclusionMode.Manual);
    };

    const ModeSelectButtons = {
        service: {
            classname: classnames(
                'mode-select-button',
                { enabled: exclusionsStore.addExclusionMode === AddExclusionMode.Service },
            ),
        },
        manual: {
            classname: classnames(
                'mode-select-button',
                { enabled: exclusionsStore.addExclusionMode === AddExclusionMode.Manual },
            ),
        },
    };

    const MODE_MAP = {
        [AddExclusionMode.Service]: () => <ServiceMode />,
        [AddExclusionMode.Manual]: () => <ManualMode />,
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
                    onClick={onManualModeClick}
                    type="button"
                    className={ModeSelectButtons.manual.classname}
                >
                    {reactTranslator.getMessage('settings_exclusion_add_manually')}
                </button>
                <button
                    onClick={onServiceModeClick}
                    type="button"
                    className={ModeSelectButtons.service.classname}
                >
                    {reactTranslator.getMessage('settings_exclusion_add_from_list')}
                </button>
            </div>
            <div className="modal__mode">
                {mode()}
            </div>
        </ExclusionsModal>
    );
});
