import React, { useContext } from 'react';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { ExclusionsModal } from '../ExclusionsModal';
import { rootStore } from '../../../../stores';
import { AddExclusionMode } from '../../../../stores/ExclusionsStore';
import { ServiceMode } from './ServiceMode/ServiceMode';
import { ManualMode } from './ManualMode/ManualMode';
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

    const MODE_MAP = {
        [AddExclusionMode.SERVICE]: () => <ServiceMode />,
        [AddExclusionMode.MANUAL]: () => <ManualMode />,
    };

    const mode = MODE_MAP[exclusionsStore.addExclusionMode];

    return (
        <ExclusionsModal
            isOpen={isOpen}
            closeModal={onClose}
            // FIXME add to translations
            title="Add a website"
        >
            <div className="modal__mode-selectors">
                {/* // FIXME add to translations */}
                <button
                    onClick={onServiceModeClick}
                    type="button"
                    className={ModeSelectButtons.service.classname}
                >
                    From the list
                </button>
                {/* // FIXME add to translations */}
                <button
                    onClick={onManualModeClick}
                    type="button"
                    className={ModeSelectButtons.manual.classname}
                >
                    Manually
                </button>
            </div>
            <div className="mode">
                {mode()}
            </div>
        </ExclusionsModal>
    );
});
