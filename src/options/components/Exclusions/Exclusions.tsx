import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { Title } from '../ui/Title';
import { ModeSelector } from './ModeSelector';
import { Actions } from './Actions';
import { List } from './List';
import { AddExclusionModal } from './ExclusionsModal/AddExclusionsModal';
import { ChildrenList } from './ChildrenList';
import { ExclusionsSearch } from './Search/ExclusionsSearch';
import { translator } from '../../../common/translator';
import { ExclusionsModes } from '../../../common/exclusionsConstants';

import './exclusions.pcss';
import '../ui/radio.pcss';
import Modal from "react-modal";

export const Exclusions = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const [isOpen, setOpen] = useState(false);

    if (exclusionsStore.selectedExclusion) {
        return (
            <ChildrenList />
        );
    }

    const openChangeModeModal = () => {
        setOpen(true);
    }

    const closeChangeModeModal = () => {
        setOpen(false);
    }

    const mode = exclusionsStore.currentMode === ExclusionsModes.Regular
        ? translator.getMessage('settings_exclusion_general_title')
        : translator.getMessage('settings_exclusion_selective_title');

    const modeDescription = exclusionsStore.currentMode === ExclusionsModes.Regular
        ? translator.getMessage('settings_exclusion_general_description')
        : translator.getMessage('settings_exclusion_selective_description');

    return (
        <div className="settings">
            <div className="exclusions__mode">
                <Title
                    title={translator.getMessage('settings_exclusion_title')}
                />
                <span className="exclusions__mode__title">{mode}: </span>
                <span>{modeDescription}</span>
                <button
                    type="button"
                    className="exclusions__mode__change-mode-btn simple-button"
                    onClick={openChangeModeModal}
                >
                    {translator.getMessage('settings_exclusion_change_mode')}
                </button>
            </div>
            <div>
                <ExclusionsSearch />
                <Actions />
                <List />
                <AddExclusionModal />
            </div>
            <Modal
                isOpen={isOpen}
                className="modal select-mode-confirm"
                overlayClassName="overlay overlay--fullscreen"
                onRequestClose={closeChangeModeModal}
            >
                <button
                    type="button"
                    className="button button--icon checkbox__button modal__close-icon"
                    onClick={closeChangeModeModal}
                >
                    <svg className="icon icon--button icon--cross">
                        <use xlinkHref="#cross" />
                    </svg>
                </button>
                <ModeSelector />
            </Modal>
        </div>
    );
});
