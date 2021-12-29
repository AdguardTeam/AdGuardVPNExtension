import React, { useContext, useState } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { rootStore } from '../../../stores';
import { ExclusionsModes } from '../../../../common/exclusionsConstants';
import { reactTranslator } from '../../../../common/reactTranslator';
import { Title } from '../../ui/Title';

import '../../ui/radio.pcss';

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
        [ExclusionsModes.Regular]: {
            title: reactTranslator.getMessage('settings_exclusion_general_title'),
            description: reactTranslator.getMessage('settings_exclusion_general_description'),
        },
        [ExclusionsModes.Selective]: {
            title: reactTranslator.getMessage('settings_exclusion_selective_title'),
            description: reactTranslator.getMessage('settings_exclusion_selective_description'),
        },
    };

    const renderRadioButton = (exclusionsType: ExclusionsModes) => {
        const enabled = exclusionsType === mode;
        const titleClass = classnames('radio__title', { 'radio__title--active': enabled });

        const xlinkHref = classnames({
            '#bullet_on': enabled,
            '#bullet_off': !enabled,
        });

        return (
            <div className="settings__control">
                <div
                    className="radio"
                    onClick={enabled ? undefined : () => setMode(exclusionsType)}
                >
                    <svg className="radio__icon">
                        <use xlinkHref={xlinkHref} />
                    </svg>
                    <div className="radio__label">
                        <div className={titleClass}>
                            {titles[exclusionsType].title}
                        </div>
                        <div className="radio__description">
                            {titles[exclusionsType].description}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Modal
            isOpen={exclusionsStore.modeSelectorModalOpen}
            className="modal select-mode-confirm"
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
            <div className="settings__section">
                <Title
                    title={reactTranslator.getMessage('settings_exclusion_change_mode') as string}
                />
                <div className="settings__group">
                    <div className="settings__controls">
                        {renderRadioButton(ExclusionsModes.Regular)}
                        {renderRadioButton(ExclusionsModes.Selective)}
                    </div>
                </div>
                <div className="settings__change-mode-actions">
                    <button
                        type="button"
                        className="button button--large button--outline-secondary"
                        onClick={closeModal}
                    >
                        {reactTranslator.getMessage('settings_exclusion_modal_cancel')}
                    </button>
                    <button
                        type="button"
                        className="button button--large button--primary"
                        onClick={handleSaveMode}
                    >
                        {reactTranslator.getMessage('settings_exclusion_modal_save')}
                    </button>
                </div>
            </div>
        </Modal>
    );
});
