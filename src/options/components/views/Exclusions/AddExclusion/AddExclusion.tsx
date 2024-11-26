import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../../../common/reactTranslator';
import { rootStore } from '../../../../stores';
import { Button } from '../../../ui/Button';

import { AddExclusionModal } from './AddExclusionModal';
import { ManualMode } from './ManualMode';
import { AddExclusionConfirmModal } from './AddExclusionConfirmModal';

import './add-exclusion.pcss';

export const AddExclusion = observer(() => {
    const { exclusionsStore, notificationsStore } = useContext(rootStore);
    const {
        openAddExclusionModal,
        closeAddExclusionModal,
        setAddExclusionMode,
        validateUrl,
        addUrlToExclusions,
        restoreExclusions,
        confirmUrlToAdd,
        setConfirmAddModalOpen,
        addExclusionModalOpen,
        addExclusionMode,
        confirmAddModalOpen,
        urlToConfirm,
    } = exclusionsStore;

    const handleManualAdd = async (domain: string) => {
        if (validateUrl(domain)) {
            const addedExclusionsCount = await addUrlToExclusions(domain);
            notificationsStore.notifySuccess(
                reactTranslator.getMessage(
                    'options_exclusions_added_exclusions',
                    { count: addedExclusionsCount },
                ),
                {
                    action: reactTranslator.getMessage('settings_exclusions_undo'),
                    handler: restoreExclusions,
                },
            );
        } else {
            confirmUrlToAdd(domain);
        }

        closeAddExclusionModal();
    };

    const handleCloseConfirmModal = () => {
        setConfirmAddModalOpen(false);
    };

    const handleConfirm = async () => {
        if (urlToConfirm) {
            const addedExclusionsCount = await addUrlToExclusions(urlToConfirm);
            notificationsStore.notifySuccess(
                reactTranslator.getMessage(
                    'options_exclusions_added_exclusions',
                    { count: addedExclusionsCount },
                ),
                {
                    action: reactTranslator.getMessage('settings_exclusions_undo'),
                    handler: restoreExclusions,
                },
            );
        }
        handleCloseConfirmModal();
    };

    return (
        <>
            <Button variant="ghost" beforeIconName="plus" onClick={openAddExclusionModal}>
                {reactTranslator.getMessage('settings_exclusion_add_website')}
            </Button>
            <AddExclusionModal
                open={addExclusionModalOpen}
                mode={addExclusionMode}
                service={(
                    <>Service</>
                )}
                manual={(
                    <ManualMode
                        onClose={closeAddExclusionModal}
                        onSubmit={handleManualAdd}
                    />
                )}
                onClose={closeAddExclusionModal}
                onModeChange={setAddExclusionMode}
            />
            <AddExclusionConfirmModal
                open={confirmAddModalOpen}
                url={urlToConfirm}
                onClose={handleCloseConfirmModal}
                onConfirm={handleConfirm}
            />
        </>
    );
});
