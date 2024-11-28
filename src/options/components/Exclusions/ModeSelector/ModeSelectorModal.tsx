import React, { useContext, useState } from 'react';
import { observer } from 'mobx-react';

import { rootStore } from '../../../stores';
import { translator } from '../../../../common/translator';
import { ExclusionsMode } from '../../../../common/exclusionsConstants';
import { Modal } from '../../ui/Modal';
import { Radio } from '../../ui/Radio';
import { Button } from '../../ui/Button';

const options = [
    {
        value: ExclusionsMode.Regular,
        translationKey: 'settings_exclusion_general_title',
    },
    {
        value: ExclusionsMode.Selective,
        translationKey: 'settings_exclusion_selective_title',
    },
];

export const ModeSelectorModal = observer(() => {
    const { exclusionsStore } = useContext(rootStore);

    const [mode, setMode] = useState(exclusionsStore.currentMode);

    const handleCloseModal = () => {
        exclusionsStore.setModeSelectorModalOpen(false);
        setMode(exclusionsStore.currentMode);
    };

    const handleSaveMode = async () => {
        await exclusionsStore.setCurrentMode(mode);
        exclusionsStore.setModeSelectorModalOpen(false);
    };

    return (
        <Modal
            title={translator.getMessage('settings_exclusion_change_mode_modal_title')}
            open={exclusionsStore.modeSelectorModalOpen}
            onClose={handleCloseModal}
        >
            <div className="mode-selector__content">
                {options.map(({ value, translationKey }) => (
                    <Radio
                        key={value}
                        value={value}
                        active={mode === value}
                        title={translator.getMessage(translationKey)}
                        variant="thin"
                        onSelect={setMode}
                    />
                ))}
            </div>
            <div className="form__actions">
                <Button size="large" onClick={handleSaveMode}>
                    {translator.getMessage('settings_exclusion_modal_save')}
                </Button>
                <Button variant="outline" size="large" onClick={handleCloseModal}>
                    {translator.getMessage('settings_exclusion_modal_cancel')}
                </Button>
            </div>
        </Modal>
    );
});
