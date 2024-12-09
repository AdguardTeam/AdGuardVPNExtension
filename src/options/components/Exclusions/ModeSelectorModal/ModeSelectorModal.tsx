import React, { useContext, useState } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';

import classnames from 'classnames';

import { rootStore } from '../../../stores';
import { ExclusionsMode } from '../../../../common/exclusionsConstants';
import { translator } from '../../../../common/translator';

export const ModeSelectorModal = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const [mode, setMode] = useState(exclusionsStore.currentMode);

    const closeModal = () => {
        exclusionsStore.setModeSelectorModalOpen(false);
        setMode(exclusionsStore.currentMode);
    };

    const handleSaveMode = async () => {
        await exclusionsStore.setCurrentMode(mode);
        exclusionsStore.setModeSelectorModalOpen(false);
    };

    const titles = {
        [ExclusionsMode.Regular]: translator.getMessage('settings_exclusion_general_title'),
        [ExclusionsMode.Selective]: translator.getMessage('settings_exclusion_selective_title'),
    };

    const renderRadioButton = (exclusionsType: ExclusionsMode) => {
        const enabled = exclusionsType === mode;
        const titleClass = classnames('radio__title', { 'radio__title--active': enabled });

        const xlinkHref = classnames({
            '#bullet_on': enabled,
            '#bullet_off': !enabled,
        });

        return (
            <button
                type="button"
                className="radio"
                onClick={() => setMode(exclusionsType)}
            >
                <svg className="radio__icon">
                    <use xlinkHref={xlinkHref} />
                </svg>
                <div className="radio__label">
                    <div className={titleClass}>
                        {titles[exclusionsType]}
                    </div>
                </div>
            </button>
        );
    };

    return (
        <Modal
            isOpen={exclusionsStore.modeSelectorModalOpen}
            className="modal modal-exclusions select-mode-confirm"
            overlayClassName="overlay overlay--fullscreen"
            onRequestClose={closeModal}
        >
            <button
                type="button"
                className="button button--icon checkbox__button modal__close-icon"
                onClick={closeModal}
            >
                <svg className="icon icon--button icon--cross">
                    <use xlinkHref="#cross" />
                </svg>
            </button>
            <div className="modal__title">
                {translator.getMessage('settings_exclusion_change_mode_modal_title')}
            </div>
            <div className="settings__group">
                {renderRadioButton(ExclusionsMode.Regular)}
                {renderRadioButton(ExclusionsMode.Selective)}
            </div>
            <div className="settings__change-mode-actions">
                <button
                    type="button"
                    className="button button--large button--outline-secondary"
                    onClick={closeModal}
                >
                    {translator.getMessage('settings_exclusion_modal_cancel')}
                </button>
                <button
                    type="button"
                    className="button button--large button--primary"
                    onClick={handleSaveMode}
                >
                    {translator.getMessage('settings_exclusion_modal_save')}
                </button>
            </div>
        </Modal>
    );
});
