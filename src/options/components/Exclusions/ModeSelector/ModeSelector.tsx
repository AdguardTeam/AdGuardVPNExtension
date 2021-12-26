import React, { useContext, useState } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import { rootStore } from '../../../stores';
import { ExclusionsModes } from '../../../../common/exclusionsConstants';
import { reactTranslator } from '../../../../common/reactTranslator';
import {translator} from "../../../../common/translator";
import {Title} from "../../ui/Title";

export const ModeSelector = observer(() => {
    const { exclusionsStore } = useContext(rootStore);
    const [isOpen, setOpen] = useState(false);
    const openModal = () => setOpen(true);
    const closeModal = () => setOpen(false);

    const {
        currentMode,
        toggleInverted,
    } = exclusionsStore;

    const onChange = (type: ExclusionsModes) => async () => {
        if (type === ExclusionsModes.Selective) {
            openModal();
            return;
        }
        await toggleInverted(type);
    };

    const toggleSelectiveMode = async () => {
        await toggleInverted(ExclusionsModes.Selective);
        closeModal();
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
            {/* FIXME remove confirmation modal and add buttons Save and Cancel */}
            {/* FIXME move change mode modal here */}
            <div className="settings__section">
                <Title
                    title={translator.getMessage('settings_exclusion_change_mode')}
                />
                <div className="settings__group">
                    <div className="settings__controls">
                        {renderRadioButton(ExclusionsModes.Regular)}
                        {renderRadioButton(ExclusionsModes.Selective)}
                    </div>
                </div>

            </div>
        </>
    );
});
