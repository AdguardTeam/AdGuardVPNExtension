import React, { useContext } from 'react';
import { observer } from 'mobx-react';

import { reactTranslator } from '../../../../../common/reactTranslator';
import { rootStore } from '../../../../stores';
import { Button } from '../../../ui/Button';

import { AddExclusionModal } from './AddExclusionModal';

import './add-exclusion.pcss';

export const AddExclusion = observer(() => {
    const { exclusionsStore } = useContext(rootStore);
    const {
        openAddExclusionModal,
        closeAddExclusionModal,
        setAddExclusionMode,
    } = exclusionsStore;

    const handleSaveClick = () => {};

    return (
        <>
            <Button variant="ghost" beforeIconName="plus" onClick={openAddExclusionModal}>
                {reactTranslator.getMessage('settings_exclusion_add_website')}
            </Button>
            <AddExclusionModal
                open={exclusionsStore.addExclusionModalOpen}
                mode={exclusionsStore.addExclusionMode}
                service={(
                    <>Service</>
                )}
                manual={(
                    <>Manual</>
                )}
                onClose={closeAddExclusionModal}
                onModeChange={setAddExclusionMode}
                onSaveClick={handleSaveClick}
            />
        </>
    );
});
