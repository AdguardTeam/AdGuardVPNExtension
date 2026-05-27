import React, { type ReactElement, useContext, useEffect } from 'react';
import { observer } from 'mobx-react';

import { TelemetryActionName, TelemetryScreenName } from '../../../background/telemetry/telemetryEnums';
import { rootStore } from '../../stores';
import { Title } from '../ui/Title';
import { ProfileHint } from '../ui/ProfileHint';
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
 * Exclusions component props.
 */
type ExclusionsProps = {
    /**
     * Back button handler. When provided, Title shows a back arrow.
     */
    onBack?: () => void;

    /**
     * Whether the component is rendered inside a profile context.
     * Defaults to false.
     */
    isProfileContext?: boolean;
};

/**
 * Exclusions page component.
 */
export const Exclusions = observer(({ onBack, isProfileContext = false }: ExclusionsProps) => {
    const { exclusionsStore, telemetryStore } = useContext(rootStore);

    useEffect(() => {
        exclusionsStore.resetUiState();
        return (): void => {
            exclusionsStore.resetUiState();
        };
    }, [exclusionsStore]);

    const {
        modeSelectorModalOpen,
        addExclusionModalOpen,
        removeAllModalOpen,
        selectedExclusion,
        confirmAddModalOpen,
        selectListModalOpen,
    } = exclusionsStore;

    const canSendTelemetry = !modeSelectorModalOpen // `DialogExclusionsModeSelection` rendered on top of this screen
        && !addExclusionModalOpen // `DialogAddWebsiteExclusion` rendered on top of this screen
        && !removeAllModalOpen // `DialogExclusionsRemoveAll` rendered on top of this screen
        && !selectedExclusion // `ExclusionsDomainDetailsScreen` rendered on top of this screen
        && !confirmAddModalOpen // `DialogExclusionsAddNotValidDomain` rendered on top of this screen
        && !selectListModalOpen; // `DialogImportedExclusions` rendered on top of this screen

    const exclusionsScreenName = isProfileContext
        ? TelemetryScreenName.ProfileExclusionScreen
        : TelemetryScreenName.ExclusionsScreen;

    useTelemetryPageViewEvent(
        telemetryStore,
        exclusionsScreenName,
        canSendTelemetry,
    );

    if (selectedExclusion) {
        return (
            <ChildrenList />
        );
    }

    const openModeSelectorModal = (): void => {
        telemetryStore.sendCustomEvent(
            isProfileContext ? TelemetryActionName.ProfileModeClick : TelemetryActionName.ModeClick,
            exclusionsScreenName,
        );
        exclusionsStore.setModeSelectorModalOpen(true);
    };

    const modeInfoParams = {
        span: (content: string): ReactElement => {
            return (
                <button
                    type="button"
                    className="exclusions__mode-btn has-tab-focus"
                    onClick={openModeSelectorModal}
                >
                    {content}
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

    const onAddExclusionClick = (): void => {
        telemetryStore.sendCustomEvent(
            isProfileContext ? TelemetryActionName.ProfileAddWebsiteClick : TelemetryActionName.AddWebsiteClick,
            exclusionsScreenName,
        );
        exclusionsStore.openAddExclusionModal();
    };

    const renderSelectiveModeWarning = (): ReactElement | null => {
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
                onClick={onBack}
                subtitleIndent={false}
                subtitle={(
                    <>
                        {modeInfo}
                        <ProfileHint profileId={exclusionsStore.profileId} />
                        {renderSelectiveModeWarning()}
                        <ExclusionsSearch isProfileContext={isProfileContext} />
                    </>
                )}
                action={<Actions isProfileContext={isProfileContext} />}
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
            <AddExclusionModal isProfileContext={isProfileContext} />
            <ConfirmAddModal />
            <ModeSelectorModal />
        </div>
    );
});
