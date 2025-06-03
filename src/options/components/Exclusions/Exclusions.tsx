import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import { rootStore } from '../../stores';
import { Title } from '../ui/Title';
import { translator } from '../../../common/translator';
import { reactTranslator } from '../../../common/reactTranslator';
import { ExclusionsMode } from '../../../common/exclusionsConstants';
import { useTelemetryPageViewEvent } from '../../../common/telemetry/useTelemetryPageViewEvent';
import { Icon } from '../../../common/components/Icons';
import { Button } from '../ui/Button';

import { ModeSelectorModal } from './ModeSelectorModal';
import { Actions } from './Actions';
import { List } from './List';
import { AddExclusionModal, ConfirmAddModal } from './ExclusionsModal';
import { ChildrenList } from './ChildrenList';
import { ExclusionsSearch } from './Search';

import './exclusions.pcss';

/**
 * Exclusions page component.
 */
export const Exclusions = observer(() => {
    const { exclusionsStore, telemetryStore } = useContext(rootStore);

    const {
        modeSelectorModalOpen,
        addExclusionModalOpen,
        removeAllModalOpen,
        selectedExclusion,
        confirmAddModalOpen,
    } = exclusionsStore;

    const canSendTelemetry = !modeSelectorModalOpen // `DialogExclusionsModeSelection` rendered on top of this screen
        && !addExclusionModalOpen // `DialogAddWebsiteExclusion` rendered on top of this screen
        && !removeAllModalOpen // `DialogExclusionsRemoveAll` rendered on top of this screen
        && !selectedExclusion // `ExclusionsDomainDetailsScreen` rendered on top of this screen
        && !confirmAddModalOpen; // `DialogExclusionsAddNotValidDomain` rendered on top of this screen

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.ExclusionsScreen,
        canSendTelemetry,
    );

    if (selectedExclusion) {
        return (
            <ChildrenList />
        );
    }

    const openModeSelectorModal = () => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.ModeClick,
            TelemetryScreenName.ExclusionsScreen,
        );
        exclusionsStore.setModeSelectorModalOpen(true);
    };

    const modeInfoParams = {
        span: (chunks: string) => {
            return (
                <button
                    type="button"
                    className="exclusions__mode-btn has-tab-focus"
                    onClick={openModeSelectorModal}
                >
                    {chunks}
                    <Icon
                        name="pencil"
                        size="16"
                        className="exclusions__mode-btn-icon"
                    />
                </button>
            );
        },
    };

    const generalModeInfo = reactTranslator.getMessage('settings_exclusion_general_mode_info', modeInfoParams);
    const selectiveModeInfo = reactTranslator.getMessage('settings_exclusion_selective_mode_info', modeInfoParams);

    const modeInfo = exclusionsStore.currentMode === ExclusionsMode.Regular
        ? generalModeInfo
        : selectiveModeInfo;

    const onAddExclusionClick = () => {
        telemetryStore.sendCustomEvent(
            TelemetryActionName.AddWebsiteClick,
            TelemetryScreenName.ExclusionsScreen,
        );
        exclusionsStore.openAddExclusionModal();
    };

    const renderSelectiveModeWarning = () => {
        if (exclusionsStore.currentMode === ExclusionsMode.Selective
            && !exclusionsStore.exclusionsTree.children.length) {
            return (
                <div className="exclusions__mode-warning">
                    {translator.getMessage('settings_exclusion_selective_mode_warning')}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="exclusions">
            <Title
                title={translator.getMessage('settings_exclusion_title')}
                subtitle={(
                    <>
                        {modeInfo}
                        {renderSelectiveModeWarning()}
                        <ExclusionsSearch />
                    </>
                )}
                action={<Actions />}
            />
            <List />
            {!exclusionsStore.exclusionsSearchValue && (
                <Button
                    variant="transparent"
                    beforeIconName="plus"
                    onClick={onAddExclusionClick}
                >
                    {translator.getMessage('settings_exclusion_add_website')}
                </Button>
            )}
            <AddExclusionModal />
            <ConfirmAddModal />
            <ModeSelectorModal />
        </div>
    );
});
