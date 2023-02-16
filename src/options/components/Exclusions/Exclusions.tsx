import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../stores';
import { Title } from '../ui/Title';
import { ModeSelectorModal } from './ModeSelectorModal';
import { Actions } from './Actions';
import { List } from './List';
import { AddExclusionModal } from './ExclusionsModal/AddExclusionsModal';
import { ConfirmAddModal } from './ExclusionsModal/ConfirmAddModal';
import { ChildrenList } from './ChildrenList';
import { ExclusionsSearch } from './Search/ExclusionsSearch';
import { translator } from '../../../common/translator';
import { ExclusionsMode } from '../../../common/exclusionsConstants';
import { reactTranslator } from '../../../common/reactTranslator';

import './exclusions.pcss';

export const Exclusions = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    if (exclusionsStore.selectedExclusion) {
        return (
            <ChildrenList />
        );
    }

    const openModeSelectorModal = () => {
        exclusionsStore.setModeSelectorModalOpen(true);
    };

    const modeInfoParams = {
        span: (chunks: string) => {
            return (
                <span className="exclusions__mode--link" onClick={openModeSelectorModal}>
                    {chunks}
                    <svg className="icon icon--pencil">
                        <use xlinkHref="#pencil" />
                    </svg>
                </span>
            );
        },
    };

    const generalModeInfo = reactTranslator.getMessage('settings_exclusion_general_mode_info', modeInfoParams);
    const selectiveModeInfo = reactTranslator.getMessage('settings_exclusion_selective_mode_info', modeInfoParams);

    const modeInfo = exclusionsStore.currentMode === ExclusionsMode.Regular
        ? generalModeInfo
        : selectiveModeInfo;

    const onAddExclusionClick = () => {
        exclusionsStore.openAddExclusionModal();
    };

    const renderSelectiveModeWarning = () => {
        if (exclusionsStore.currentMode === ExclusionsMode.Selective
            && !exclusionsStore.exclusionsTree.children.length) {
            return (
                <div className="exclusions__mode--warning">
                    {reactTranslator.getMessage('settings_exclusion_selective_mode_warning')}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="settings">
            <div className="exclusions__mode">
                <Title
                    title={translator.getMessage('settings_exclusion_title')}
                />
                <div className="exclusions__mode--info">
                    {modeInfo}
                </div>
                {renderSelectiveModeWarning()}
                <Actions />
            </div>
            <div>
                <div className="exclusions__search">
                    <ExclusionsSearch />
                </div>
                <button
                    type="button"
                    className="exclusions__add-website simple-button"
                    onClick={onAddExclusionClick}
                >
                    <svg className="icon icon--button">
                        <use xlinkHref="#plus" />
                    </svg>
                    {reactTranslator.getMessage('settings_exclusion_add_website')}
                </button>
                <List />
                <AddExclusionModal />
                <ConfirmAddModal />
            </div>
            <ModeSelectorModal />
        </div>
    );
});
