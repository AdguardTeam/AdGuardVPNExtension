import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { TelemetryScreenName } from '../../../../background/telemetry';
import { rootStore } from '../../../stores';
import { Title } from '../../ui/Title';
import { translator } from '../../../../common/translator';
import { ExclusionsMode, ExclusionsType } from '../../../../common/exclusionsConstants';
import { isTopLevel } from '../../../../common/utils/url';
import { useTelemetryPageViewEvent } from '../../../../common/telemetry';
import { Button } from '../../ui/Button';
import { Exclusion } from '../Exclusion';

import { SubdomainModal } from './SubdomainModal';
import { ResetServiceModal } from './ResetServiceModal';

export const ChildrenList = observer(() => {
    const { exclusionsStore, telemetryStore } = useContext(rootStore);
    const { selectedExclusion, addSubdomainModalOpen } = exclusionsStore;

    // `DialogExclusionsAddSubdomain` is rendered on top of this screen
    const canSendTelemetry = !addSubdomainModalOpen;

    useTelemetryPageViewEvent(
        telemetryStore,
        TelemetryScreenName.ExclusionsDomainDetailsScreen,
        canSendTelemetry,
    );

    if (!selectedExclusion || selectedExclusion.children.length === 0) {
        return null;
    }

    const subtitle = exclusionsStore.currentMode === ExclusionsMode.Regular
        ? translator.getMessage('settings_exclusion_group_settings_subtitle_regular_mode')
        : translator.getMessage('settings_exclusion_group_settings_subtitle_selective_mode');

    const goBackHandler = () => {
        exclusionsStore.goBackHandler();
    };

    const openResetServiceModal = () => {
        exclusionsStore.setResetServiceModalOpen(true);
    };

    const onAddSubdomainClick = () => {
        exclusionsStore.openAddSubdomainModal();
    };

    const isModifiedService = selectedExclusion.type === ExclusionsType.Service
        && !exclusionsStore.isServiceDefaultState(selectedExclusion.id);

    const isExclusionsGroup = selectedExclusion.type === ExclusionsType.Group
        && !isTopLevel(selectedExclusion.hostname);

    return (
        <>
            <Title
                title={selectedExclusion.hostname}
                subtitle={subtitle}
                onClick={goBackHandler}
            />
            {exclusionsStore.sortedExclusions?.map((exclusion) => {
                return (
                    <Exclusion
                        key={exclusion.id}
                        exclusion={exclusion}
                    />
                );
            })}
            {isExclusionsGroup && (
                <div className="exclusions__add-subdomain">
                    <Button
                        variant="transparent"
                        beforeIconName="plus"
                        onClick={onAddSubdomainClick}
                    >
                        {translator.getMessage('settings_exclusion_add_subdomain')}
                    </Button>
                </div>
            )}
            {isModifiedService && (
                <Button
                    variant="outlined"
                    className="exclusions__reset-default"
                    onClick={openResetServiceModal}
                >
                    {translator.getMessage('settings_exclusion_reset_to_default')}
                </Button>
            )}
            <SubdomainModal />
            <ResetServiceModal />
        </>
    );
});
