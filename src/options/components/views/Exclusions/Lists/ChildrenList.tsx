import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../../../common/reactTranslator';
import { ExclusionsMode, ExclusionsType } from '../../../../../common/exclusionsConstants';
import { isTopLevel } from '../../../../../common/utils/url';
import { rootStore } from '../../../../stores';
import { Title } from '../../../ui/Title';
import { Button } from '../../../ui/Button';
import { Exclusion } from '../Exclusion';

import { ResetServiceModal } from './ResetServiceModal';

export const ChildrenList = observer(() => {
    const { exclusionsStore } = useContext(rootStore);
    const { selectedExclusion } = exclusionsStore;

    if (!selectedExclusion || selectedExclusion.children.length === 0) {
        return null;
    }

    const exclusions = exclusionsStore.sortedExclusions ?? [];

    const isModifiedService = selectedExclusion.type === ExclusionsType.Service
        && !exclusionsStore.isServiceDefaultState(selectedExclusion.id);

    const isExclusionsGroup = selectedExclusion.type === ExclusionsType.Group
        && !isTopLevel(selectedExclusion.hostname);

    const description = exclusionsStore.currentMode === ExclusionsMode.Regular
        ? reactTranslator.getMessage('settings_exclusion_group_settings_subtitle_regular_mode')
        : reactTranslator.getMessage('settings_exclusion_group_settings_subtitle_selective_mode');

    const handleGoBack = () => {
        exclusionsStore.goBackHandler();
    };

    const handleOpenResetServiceModal = () => {
        exclusionsStore.setResetServiceModalOpen(true);
    };

    const handleCloseResetServiceModal = () => {
        exclusionsStore.setResetServiceModalOpen(false);
    };

    const handleConfirmResetServiceModal = async () => {
        if (!selectedExclusion) {
            return;
        }

        await exclusionsStore.resetServiceData(selectedExclusion.id);
        handleCloseResetServiceModal();
    };

    const handleOpenAddSubdomainModal = () => {
        exclusionsStore.openAddSubdomainModal();
    };

    // FIXME: Add loader
    return (
        <>
            <Title
                title={selectedExclusion.hostname}
                description={description}
                onClick={handleGoBack}
                smallGap
            />
            <div>
                {exclusions.map((exclusion) => (
                    <Exclusion
                        key={exclusion.id}
                        exclusion={exclusion}
                    />
                ))}
            </div>
            {isExclusionsGroup && (
                <div style={{ paddingLeft: 40 }}>
                    <Button variant="ghost" beforeIconName="plus" onClick={handleOpenAddSubdomainModal}>
                        {reactTranslator.getMessage('settings_exclusion_add_subdomain')}
                    </Button>
                </div>
            )}
            {isModifiedService && (
                <Button
                    variant="outline"
                    className="exclusions__reset-default"
                    onClick={handleOpenResetServiceModal}
                >
                    {reactTranslator.getMessage('settings_exclusion_reset_to_default')}
                </Button>
            )}
            <ResetServiceModal
                open={exclusionsStore.resetServiceModalOpen}
                hostname={selectedExclusion.hostname}
                onClose={handleCloseResetServiceModal}
                onConfirm={handleConfirmResetServiceModal}
            />
        </>
    );
});
