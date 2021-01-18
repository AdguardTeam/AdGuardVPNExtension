import React, { useContext, useState } from 'react';
import Modal from 'react-modal';
import { observer } from 'mobx-react';
import classnames from 'classnames';

import Form from './Form';
import List from './List';
import rootStore from '../../../stores';
import { EXCLUSIONS_MODES } from '../../../../background/exclusions/exclusionsConstants';
import { reactTranslator } from '../../../../common/reactTranslator';

Modal.setAppElement('#root');

const Mode = observer(() => {
    const { settingsStore } = useContext(rootStore);
    const [isOpen, setOpen] = useState(false);
    const openModal = () => setOpen(true);
    const closeModal = () => setOpen(false);

    const {
        exclusionsCurrentMode,
        toggleInverted,
    } = settingsStore;

    const onChange = (type) => async () => {
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

    const modes = [
        EXCLUSIONS_MODES.REGULAR,
        EXCLUSIONS_MODES.SELECTIVE,
    ];

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

    const renderControls = (exclusionsType) => {
        const enabled = exclusionsType === exclusionsCurrentMode;
        const titleClass = classnames('radio__title', { 'radio__title--active': enabled });

        const xlinkHref = classnames({
            '#bullet_on': enabled,
            '#bullet_off': !enabled,
        });

        return (
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
                <div className="modal__title">{reactTranslator.getMessage('options_selective_mode_popup_attention')}</div>
                <div className="modal__message">{reactTranslator.getMessage('options_selective_mode_popup_message')}</div>
                <button type="button" onClick={toggleSelectiveMode} className="button modal__button">{reactTranslator.getMessage('options_selective_mode_popup_button_switch_now')}</button>
            </Modal>
            <div className="settings__section">
                <div className="settings__title">
                    {reactTranslator.getMessage('settings_connection_mode_title')}
                </div>
                <div className="settings__group">
                    <div className="settings__controls">
                        {modes.map((type) => (
                            <div className="settings__control" key={type}>
                                {renderControls(type)}
                            </div>
                        ))}
                    </div>
                    <div className="settings__control">
                        <Form />
                        <List />
                    </div>
                </div>
            </div>
        </>
    );
});

export default Mode;
