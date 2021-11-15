import React, { useContext, useState } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { rootStore } from '../../../stores';
import { EXCLUSIONS_MODES } from '../../../../common/exclusionsConstants';
import { reactTranslator } from '../../../../common/reactTranslator';

export const ModeSelector = observer(() => {
    const { exclusionsStore } = useContext(rootStore);
    const [isOpen, setOpen] = useState(false);
    const openModal = () => setOpen(true);
    const closeModal = () => setOpen(false);

    const {
        currentMode,
        toggleInverted,
    } = exclusionsStore;

    const onChange = (type: EXCLUSIONS_MODES) => async () => {
        if (type === EXCLUSIONS_MODES.SELECTIVE) {
            openModal();
            return;
        }
        await toggleInverted(type);
    };

    const toggleSelectiveMode = async () => {
        await toggleInverted(EXCLUSIONS_MODES.SELECTIVE);
        closeModal();
    };

    const titles = {
        [EXCLUSIONS_MODES.REGULAR]: {
            title: reactTranslator.getMessage('settings_exclusion_regular_title'),
            description: reactTranslator.getMessage('settings_exclusion_regular_description'),
        },
        [EXCLUSIONS_MODES.SELECTIVE]: {
            title: reactTranslator.getMessage('settings_exclusion_selective_title'),
            description: reactTranslator.getMessage('settings_exclusion_selective_description'),
        },
    };

    const renderRadioButton = (exclusionsType: EXCLUSIONS_MODES) => {
        const enabled = exclusionsType === currentMode;
        const titleClass = classnames('radio__title', { 'radio__title--active': enabled });

        const xlinkHref = classnames({
            '#bullet_on': enabled,
            '#bullet_off': !enabled,
        });

        return (
            <div className="settings__control">
                <div className="radio" onClick={enabled ? undefined : onChange(exclusionsType)}>
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
        <>
            <Modal
                isOpen={isOpen}
                className="modal"
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
                <div className="modal__icon" />
                <div
                    className="modal__title"
                >
                    {reactTranslator.getMessage('options_selective_mode_popup_attention')}
                </div>
                <div
                    className="modal__message"
                >
                    {reactTranslator.getMessage('options_selective_mode_popup_message')}
                </div>
                <button
                    type="button"
                    onClick={toggleSelectiveMode}
                    className="button modal__button"
                >
                    {reactTranslator.getMessage('options_selective_mode_popup_button_switch_now')}
                </button>
            </Modal>
            <div className="settings__section">
                <div className="settings__title">
                    {reactTranslator.getMessage('settings_connection_mode_title')}
                </div>
                <div className="settings__group">
                    <div className="settings__controls">
                        {renderRadioButton(EXCLUSIONS_MODES.REGULAR)}
                        {renderRadioButton(EXCLUSIONS_MODES.SELECTIVE)}
                    </div>
                </div>
            </div>
        </>
    );
});
